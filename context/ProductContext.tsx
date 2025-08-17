import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product } from '../types';
import { db } from '../lib/firebase';
import { products as initialProducts } from '../data/mockData';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (updatedProduct: Product) => Promise<void>;
  updateStock: (productId: string, adjustment: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollectionRef = db.collection('products');
        const productSnapshot = await productsCollectionRef.get();
        if (productSnapshot.empty) {
          console.log("No products found in Firestore, seeding from mock data...");
          const batch = db.batch();
          for (const product of initialProducts) {
            const docRef = db.collection('products').doc(product.id);
            batch.set(docRef, product);
          }
          await batch.commit();
          setProducts(initialProducts);
        } else {
          const productsList = productSnapshot.docs.map(doc => doc.data() as Product);
          setProducts(productsList);
        }
      } catch (error) {
        console.error("Error fetching products from Firestore:", error);
        setProducts(initialProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addProduct = async (product: Product) => {
    const productRef = db.collection('products').doc(product.id);
    await productRef.set(product);
    setProducts(prevProducts => [product, ...prevProducts]);
  };

  const updateProduct = async (updatedProduct: Product) => {
    const productRef = db.collection('products').doc(updatedProduct.id);
    await productRef.update({ ...updatedProduct });
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };

  const updateStock = async (productId: string, adjustment: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedProduct = {
        ...product,
        stock: { ...product.stock, available: product.stock.available + adjustment }
      };
      await updateProduct(updatedProduct);
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, addProduct, updateProduct, updateStock }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};