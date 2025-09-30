import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { createContext, useState, useContext } from "react";
import { db } from "../firebase";

const CommentsContext = createContext();

export const CommentsProvider = ({ children }) => {
    const [comments, setComments] = useState([]);

    const addComment = async (storyId, subject, text) => {
        const newComment = {
            storyId,
            subject,
            text,
            timestamp: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(collection(db, "comments"), newComment);
            setComments((prev) => [...prev, { id: docRef.id, ...newComment }]);
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