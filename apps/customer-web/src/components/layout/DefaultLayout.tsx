import React from "react";
import Header from "./Header";


interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

    return (
        <div
            className="
                min-h-screen flex flex-col font-sans
                bg-background-light text-text-primary
                dark:bg-background-dark dark:text-text-inverse
            "
        >

            <Header />
            <main className="flex-grow flex flex-col">
                {children}
            </main>
        </div>
    );
};

export default Layout;
