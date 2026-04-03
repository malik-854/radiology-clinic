import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, where, orderBy, limit } from 'firebase/firestore';

export function useCollection(path, constraints = []) {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    const q = query(collection(db, path), ...constraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(docs);
    });
    return () => unsubscribe();
  }, [path, JSON.stringify(constraints)]);

  return data;
}

export function useDocument(path, id) {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, path, id.toString()), (snapshot) => {
      setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    });
    return () => unsubscribe();
  }, [path, id]);

  return data;
}

export const fsdb = {
  patients: {
    add: async (data) => {
      const docRef = await addDoc(collection(db, 'patients'), data);
      return docRef.id;
    },
    update: async (id, data) => updateDoc(doc(db, 'patients', id.toString()), data),
    delete: async (id) => deleteDoc(doc(db, 'patients', id.toString())),
    get: async (id) => {
      const snap = await getDoc(doc(db, 'patients', id.toString()));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
  },
  reports: {
    add: async (data) => {
      const docRef = await addDoc(collection(db, 'reports'), data);
      return docRef.id;
    },
    update: async (id, data) => updateDoc(doc(db, 'reports', id.toString()), data),
    delete: async (id) => deleteDoc(doc(db, 'reports', id.toString())),
    get: async (id) => {
      const snap = await getDoc(doc(db, 'reports', id.toString()));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
  },
  invoices: {
    add: async (data) => {
      const docRef = await addDoc(collection(db, 'invoices'), data);
      return docRef.id;
    },
    update: async (id, data) => updateDoc(doc(db, 'invoices', id.toString()), data),
    delete: async (id) => deleteDoc(doc(db, 'invoices', id.toString())),
    get: async (id) => {
      const snap = await getDoc(doc(db, 'invoices', id.toString()));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
  },
  templates: {
    add: async (data) => {
      const docRef = await addDoc(collection(db, 'templates'), data);
      return docRef.id;
    },
    update: async (id, data) => updateDoc(doc(db, 'templates', id.toString()), data),
    delete: async (id) => deleteDoc(doc(db, 'templates', id.toString())),
    get: async (id) => {
      const snap = await getDoc(doc(db, 'templates', id.toString()));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
  },
  services: {
    add: async (data) => {
      const docRef = await addDoc(collection(db, 'services'), data);
      return docRef.id;
    }
  }
};
