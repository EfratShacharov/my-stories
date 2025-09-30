import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDpjiWdS9KEi5mmAdVq06BVDfsvEn_LB00",
    authDomain: "my-stories-a9ef5.firebaseapp.com",
    projectId: "my-stories-a9ef5",
    storageBucket: "my-stories-a9ef5.appspot.com",
    messagingSenderId: "799007114038",
    appId: "1:799007114038:web:332edef8477a05ed16e997"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };