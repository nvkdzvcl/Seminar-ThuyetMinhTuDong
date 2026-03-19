import React from "react";
import Logo from "./Logo";

const Footer: React.FC = () => {
    return (
        <footer
            className="
                w-full py-12
                bg-background-darkHeader
                text-text-inverse
            "
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

                {/* Top Footer */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16">
                    <Logo variant="light" />

                    {/* Divider */}
                    <div className="hidden md:block w-px h-10 bg-text-inverse/30 mx-4" />

                    <div className="text-left">
                        <p className="font-semibold">
                            AI-powered TOEIC Learning Platform
                        </p>
                        <p className="text-text-inverse/70 text-sm">
                            Practice • Analyze • Improve your score
                        </p>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center items-center gap-3 text-text-inverse/70 text-sm">
                        <a
                            href="#"
                            className="hover:text-brand-primary transition-colors"
                        >
                            TOEIC Courses
                        </a>
                        <span>|</span>
                        <a
                            href="#"
                            className="hover:text-brand-primary transition-colors"
                        >
                            Practice Tests
                        </a>
                        <span>|</span>
                        <a
                            href="#"
                            className="hover:text-brand-primary transition-colors"
                        >
                            Privacy Policy
                        </a>
                        <span>|</span>
                        <a
                            href="#"
                            className="hover:text-brand-primary transition-colors"
                        >
                            Terms of Service
                        </a>
                    </div>

                    <p className="text-text-inverse/50 text-sm mt-2 text-center">
                        © {new Date().getFullYear()} AI TOEIC Master. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
