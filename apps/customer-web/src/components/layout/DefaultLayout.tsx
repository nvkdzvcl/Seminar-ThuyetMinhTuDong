import React from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import MiniAudioPlayer from "./MiniAudioPlayer";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

    return (
        <div
            className="
                min-h-screen flex flex-col font-sans
                bg-slate-50 text-slate-900
            "
        >

            <Header />
            <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col pb-[7.5rem]">
                {children}
            </main>
            <MiniAudioPlayer />
            <BottomNav />
        </div>
    );
};

export default Layout;
