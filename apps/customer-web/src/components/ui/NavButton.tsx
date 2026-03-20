import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {routePath} from "../../routes/route";

interface NavButtonProps {
    path: string;
    label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ path, label }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive =
        path === routePath.HomeDishPage
            ? location.pathname === routePath.HomeDishPage
            : location.pathname.startsWith(path);
    return (
        <button
            onClick={() => navigate(path)}
            className={`
                relative text-sm font-medium transition-colors
                ${isActive ? "text-brand-primary" : "text-text-primary dark:text-text-inverse hover:text-brand-primary"}
            `}
        >
            {label}
            <span
                className={`
                    absolute left-0 -bottom-1 h-0.5 w-full bg-brand-primary transition-all duration-300
                    ${isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}
                `}
            />
        </button>
    );
};

export default NavButton;
