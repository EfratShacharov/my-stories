import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabase";

const CommentsContext = createContext();

export const CommentsProvider = ({ children }) => {
    const [comments, setComments] = useState([]);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from("comments")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) setComments(data);
    };

    useEffect(() => {
        fetchComments();

        const subscription = supabase
            .channel("comments-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "comments"
                },
                (payload) => {
                    console.log("Realtime event:", payload);
                    fetchComments();
                }
            )
            .subscribe();

        return () => supabase.removeChannel(subscription);
    }, []);

    const addComment = async (name, storyId, subject, text, email, isAdmin = false, parentId = null, userId = null) => {

        let resolvedName = name || "";
        let resolvedEmail = email || "";

        if (userId) {
            const { data } = await supabase
                .from("users")
                .select("name, email")
                .eq("id", userId)
                .maybeSingle();

            if (data) {
                resolvedName = data.name || "";
                resolvedEmail = data.email || "";
            }
        }

        const newComment = {
            name: resolvedName,
            story_id: storyId,
            story_title: subject,
            comment: text,
            email: resolvedEmail,
            is_admin: isAdmin,
            status: isAdmin ? "approved" : "pending",
            parent_id: parentId || null,
        };

        console.log("newComment:", newComment);
        const session = await supabase.auth.getSession();

        const { error } = await supabase
            .from("comments")
            .insert([newComment]);

        if (error) {
            console.error("INSERT ERROR:", error);
        }
    };

    return (
        <CommentsContext.Provider value={{ comments, addComment, fetchComments }}>
            {children}
        </CommentsContext.Provider>
    );
};

export const useComments = () => useContext(CommentsContext);