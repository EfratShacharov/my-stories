import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import React, { createContext, useState, useContext, useEffect } from "react";
import { db } from "../firebase";

const CommentsContext = createContext();

export const CommentsProvider = ({ children }) => {
    const [comments, setComments] = useState([]);

    useEffect(() => {
        //טוען מהמקומי
        const saved = localStorage.getItem("comments");
        if (saved) {
            setComments(JSON.parse(saved));
        }

        //טוען בזמן אמת מ fireBase
        const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComments(allComments);
            localStorage.setItem("comments",JSON.stringify(allComments));
        }, (error) => {
            console.error("Error fetching comments: ", error);
        });

        return () => unsubscribe();
    },[]);

    const addComment = async (name, storyId, subject, text, email) => {
        const newComment = {
            name: name || "",
            storyId,
            subject,
            text,
            email: email || "",
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, "comments"), newComment);
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };

    return (
        <CommentsContext.Provider value={{ comments, addComment }}>
            {children}
        </CommentsContext.Provider>
    );
};

export const useComments = () => useContext(CommentsContext);