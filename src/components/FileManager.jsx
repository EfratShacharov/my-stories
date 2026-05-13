import React, { useEffect, useState } from "react";

const FileManager = () => {
    const [files, setFiles] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const savedFiles = JSON.parse(localStorage.getItem("files")) || [];
        setFiles(savedFiles);

        const savedAdmin = JSON.parse(localStorage.getItem("isAdmin")) || false;
        setIsAdmin(savedAdmin);
    }, []);

    const handleUpload = (event) => {
        const uploadedFiles = Array.from(event.target.files).filter(file =>
            file.type === "application/pdf" ||
            file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        setFiles((prev) => [...prev, ...uploadedFiles]);
    };

    const handleLogin = () => {
        setIsAdmin(true);
    };

    const handleLogout = () => {
        setIsAdmin(false);
        setFiles([]);
        localStorage.removeItem("files");
        localStorage.removeItem("isAdmin");
    };

    return (
        <div>
            <h2>ניהול קבצים</h2>

            {!isAdmin ? (
                <button onClick={handleLogin}>התחבר כמנהל</button>
            ) : (
                <>
                    <button onClick={handleLogout}>התנתק</button>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        multiple
                        onChange={handleUpload}
                    />
                    <ul>
                        {files.map((file, index) => (
                            <li key={index}>
                                {file.name} -
                                <a
                                    href={URL.createObjectURL(file)}
                                    download={file.name}
                                    target="_blank"
                                >
                                    הורדה
                                </a>
                            </li>
                        ))}
                    </ul>
                </>
            )}

        </div>
    );
};

export default FileManager;