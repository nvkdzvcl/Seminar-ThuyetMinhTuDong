type LogoProps = {
    variant?: "light" | "dark";
};

function Logo({ variant = "dark" }: LogoProps) {
    const textClass = variant === "light" ? "text-white" : "text-slate-900";
    return <div className={`text-lg font-bold ${textClass}`}>Vinh Khanh Food Tour</div>;
}

export default Logo;
