"use client";
import { api } from "./lib/api";
import styles from "./page.module.css";

export default function Home() {
    const handleClick = async () => {
        const { data, error } = await api.user.get();
        if (error) return error;
        console.log(data);
    };

    return (
        <div className={styles.page}>
            <h1>Welcome to the Web App!</h1>
            <button onClick={handleClick}>Fetch Data</button>
        </div>
    );
}
