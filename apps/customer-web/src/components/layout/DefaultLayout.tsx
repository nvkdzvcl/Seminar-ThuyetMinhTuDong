import React from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import MiniAudioPlayer from "./MiniAudioPlayer";
import { useAppSelector } from "../../stores/hooks";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const hasTranscript = useAppSelector(
        (state) => Boolean(state.audio.current?.transcript && state.audio.current.transcript.trim().length > 0)
    );
    const contentBottomPadding = hasTranscript ? "pb-[12.5rem]" : "pb-[7.5rem]";

    return (
        <div
            className="
                min-h-screen flex flex-col font-sans
                bg-slate-50 text-slate-900
            "
        >

            <Header />
            <main className={`mx-auto flex w-full max-w-5xl flex-grow flex-col ${contentBottomPadding}`}>
                {children}
            </main>
            <MiniAudioPlayer />
            <BottomNav />
        </div>
    );
};

export default Layout;
