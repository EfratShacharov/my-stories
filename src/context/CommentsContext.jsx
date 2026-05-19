import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabase";

const CommentsContext = createContext();

export const CommentsProvider = ({ children }) => {
    const [comments, setComments] = useState([]);

    useEffect(() => {
        //טוען תגובות מ - Supabase
        const fetchComments = async () => {
            const { data, error } = await supabase
                .from("comments")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("שגיאה באחזור התגובות:", error);
            } else {
                setComments(data);
            }
        };

        fetchComments();

        // האזנה לשינויים בזמן אמת
        const subscription = supabase
            .channel("comments")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (payload) => {
                setComments(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
    }, []);

    const addComment = async (name, storyId, subject, text, email, isAdmin = false, parentId = null) => {
        const newComment = {
            name: name || "",
            story_id: storyId,
            story_title: subject,
            comment: text,
            email: email || "",
            is_admin: isAdmin,
            status: isAdmin ? "approved" : "pending",
            parent_id: parentId || null,
        };

        const { error } = await supabase
            .from("comments")
            .insert([newComment]);

        if (error) {
            console.error("שגיאה בהוספת התגובה:", error);
        }

    };

    return (
        <CommentsContext.Provider value={{ comments, addComment }}>
            {children}
        </CommentsContext.Provider>
    );
};

export const useComments = () => useContext(CommentsContext);