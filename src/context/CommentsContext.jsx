import React, { createContext, useState, useContext } from "react";

const CommentsContext = createContext();

export const CommentsProvider = ({ children }) => {
    const [comments, setComments] = useState([]);

    const addComment = (storyId, subject, text) => {
        const newComment = {
            id: Date.now(),
            storyId,
            subject,
            text,
        };
        setComments((prev) => [...prev, newComment]);
    };

    return (
        <CommentsContext.Provider value={{ comments, addComment }}>
            {children}
        </CommentsContext.Provider>
    );
};

export const useComments = () => useContext(CommentsContext);