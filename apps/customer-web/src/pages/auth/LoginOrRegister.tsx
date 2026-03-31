/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


import {routePath} from "../../routes/route";
import { authService } from "../../services/authService";
import type { LoginPayload, RegisterPayload } from "../../types/auth";
import { notifyLanguageChanged } from "../../utils/language";
import { resolveLanguageOptionValue, useSupportedLanguages } from "../../hooks/useSupportedLanguages";

type Mode = "login" | "register";

const LS_ACCESS = "VINH_KHANH_FOOD_TOUR_ACCESS_TOKEN";
const LS_REFRESH = "VINH_KHANH_FOOD_TOUR_REFRESH_TOKEN";
const LS_USER = "VINH_KHANH_FOOD_TOUR_USER";


type FormErrors = Partial<Record<keyof RegisterPayload | keyof LoginPayload, string>> & {
    general?: string;
};

const initialLoginForm: LoginPayload = {
    email: "",
    password: "",
};

const initialRegisterForm: RegisterPayload = {
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    language: "en",
};

function LoginOrRegister() {
    const navigate = useNavigate();
    const { options: languageOptions, loading: languageLoading } = useSupportedLanguages();
    const [mode, setMode] = useState<Mode>("login");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [loginForm, setLoginForm] = useState<LoginPayload>(initialLoginForm);
    const [registerForm, setRegisterForm] = useState<RegisterPayload>(initialRegisterForm);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (languageOptions.length === 0) return;

        const resolvedValue = resolveLanguageOptionValue(languageOptions, registerForm.language);
        if (!resolvedValue || resolvedValue === registerForm.language) return;
        setRegisterForm((prev) => ({ ...prev, language: resolvedValue }));
    }, [languageOptions, registerForm.language]);

    const title = useMemo(() => {
        return mode === "login" ? "Welcome back" : "Create a new account";
    }, [mode]);

    const subtitle = useMemo(() => {
        return mode === "login"
            ? "Sign in to continue."
            : "Fill in your information to create an account.";
    }, [mode]);

    const switchMode = (nextMode: Mode) => {
        setMode(nextMode);
        setErrors({});
        setSuccessMessage("");
    };

    const validateLogin = () => {
        const nextErrors: FormErrors = {};

        if (!loginForm.email.trim()) {
            nextErrors.email = "Please enter your email";
        }

        if (!loginForm.password.trim()) {
            nextErrors.password = "Please enter your password";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateRegister = () => {
        const nextErrors: FormErrors = {};

        if (!registerForm.fullName.trim()) {
            nextErrors.fullName = "Please enter your full name";
        }

        if (!registerForm.phoneNumber.trim()) {
            nextErrors.phoneNumber = "Please enter your phone number";
        } else if (!/^[0-9]{9,11}$/.test(registerForm.phoneNumber.trim())) {
            nextErrors.phoneNumber = "Invalid phone number";
        }

        if (!registerForm.email.trim()) {
            nextErrors.email = "Please enter your email";
        } else if (!/^\S+@\S+\.\S+$/.test(registerForm.email.trim())) {
            nextErrors.email = "Invalid email address";
        }

        if (!registerForm.password.trim()) {
            nextErrors.password = "Please enter your password";
        } else if (registerForm.password.length < 6) {
            nextErrors.password = "Password must be at least 6 characters";
        }

        if (!registerForm.language.trim()) {
            nextErrors.language = "Please select a language";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleLoginChange = (field: keyof LoginPayload, value: string) => {
        setLoginForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };

    const handleRegisterChange = (field: keyof RegisterPayload, value: string) => {
        setRegisterForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSuccessMessage("");

        if (!validateLogin()) return;

        try {
            setLoading(true);
            const response = await authService.login(loginForm);

            if (!response?.result?.accessToken) {
                setErrors({ general: response?.message || "Login failed" });
                return;
            }
            localStorage.setItem(LS_ACCESS, response.result.accessToken);
            if (response.result.refreshToken) {
                localStorage.setItem(LS_REFRESH, response.result.refreshToken);
            }
            localStorage.setItem(LS_USER, JSON.stringify(response.result.user));
            notifyLanguageChanged();
            
            navigate(routePath.HomeDishPage);

            setSuccessMessage("Login successful");
            setLoginForm(initialLoginForm);


        } catch (error: any) {
            setErrors({
                general:
                    error?.response?.data?.message ||
                    error?.message ||
                    "An error occurred while signing in",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSuccessMessage("");

        if (!validateRegister()) return;

        try {
            setLoading(true);
            const response = await authService.register(registerForm);

            setSuccessMessage(response?.message || "Registration successful");
            setRegisterForm(initialRegisterForm);
            setErrors({});
            setMode("login");
        } catch (error: any) {
            setErrors({
                general:
                    error?.response?.data?.message || error?.message || "An error occurred while registering",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-2">
                <div className="hidden lg:block">
                    <div className="max-w-xl">
                        <div className="mb-4 inline-flex items-center rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 shadow-sm">
                            Food Street Guide
                        </div>

                        <h1 className="text-4xl font-bold leading-tight text-slate-900 xl:text-5xl">
                            Discover local food with{" "}
                            <span className="text-green-600">AI narration</span>, ordering, and smart
                            tour suggestions.
                        </h1>

                        <p className="mt-5 text-lg leading-8 text-slate-600">
                            A modern, easy-to-use experience for tourists to explore shops, listen
                            in multiple languages, and build food tours quickly.
                        </p>

                        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                                <div className="text-2xl font-bold text-green-600">GPS</div>
                                <p className="mt-2 text-sm text-slate-600">
                                    Location-based audio
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                                <div className="text-2xl font-bold text-green-600">Audio</div>
                                <p className="mt-2 text-sm text-slate-600">
                                    Multi-language guide
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                                <div className="text-2xl font-bold text-green-600">Tour</div>
                                <p className="mt-2 text-sm text-slate-600">
                                    Smart food itinerary
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-md">
                    <div className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-xl shadow-green-100/40">
                        <div className="border-b border-slate-100 p-6 pb-4">
                            <div className="flex rounded-2xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => switchMode("login")}
                                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                        mode === "login"
                                            ? "bg-white text-green-700 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Login
                                </button>

                                <button
                                    type="button"
                                    onClick={() => switchMode("register")}
                                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                        mode === "register"
                                            ? "bg-white text-green-700 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Register
                                </button>
                            </div>

                            <div className="mt-6">
                                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                                <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                            </div>
                        </div>

                        <div className="p-6">
                            {errors.general && (
                                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {errors.general}
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    {successMessage}
                                </div>
                            )}

                            {mode === "login" ? (
                                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={loginForm.email}
                                            onChange={(e) =>
                                                handleLoginChange("email", e.target.value)
                                            }
                                            placeholder="Enter your email"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-500">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={loginForm.password}
                                            onChange={(e) =>
                                                handleLoginChange("password", e.target.value)
                                            }
                                            placeholder="Enter your password"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                        />
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-500">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {loading ? "Signing in..." : "Login"}
                                    </button>
                                </form>
                            ) : (
                                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Full name
                                        </label>
                                        <input
                                            type="text"
                                            value={registerForm.fullName}
                                            onChange={(e) =>
                                                handleRegisterChange("fullName", e.target.value)
                                            }
                                            placeholder="Enter your full name"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                        />
                                        {errors.fullName && (
                                            <p className="mt-2 text-sm text-red-500">
                                                {errors.fullName}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Phone number
                                        </label>
                                        <input
                                            type="text"
                                            value={registerForm.phoneNumber}
                                            onChange={(e) =>
                                                handleRegisterChange("phoneNumber", e.target.value)
                                            }
                                            placeholder="Enter your phone number"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                        />
                                        {errors.phoneNumber && (
                                            <p className="mt-2 text-sm text-red-500">
                                                {errors.phoneNumber}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={registerForm.email}
                                            onChange={(e) =>
                                                handleRegisterChange("email", e.target.value)
                                            }
                                            placeholder="Enter your email"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-500">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={registerForm.password}
                                            onChange={(e) =>
                                                handleRegisterChange("password", e.target.value)
                                            }
                                            placeholder="Enter your password"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                        />
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-500">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div data-no-auto-translate="true">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Language {languageOptions.length > 0 ? `(${languageOptions.length})` : ""}
                                        </label>
                                        <select
                                            value={registerForm.language}
                                            onChange={(e) =>
                                                handleRegisterChange("language", e.target.value)
                                            }
                                            disabled={languageLoading || languageOptions.length === 0}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                        >
                                            {languageOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.language && (
                                            <p className="mt-2 text-sm text-red-500">
                                                {errors.language}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {loading ? "Creating account..." : "Create account"}
                                    </button>
                                </form>
                            )}

                            <div className="mt-6 text-center text-sm text-slate-500">
                                {mode === "login" ? (
                                    <>
                                        New here?{" "}
                                        <button
                                            type="button"
                                            onClick={() => switchMode("register")}
                                            className="font-semibold text-green-600 hover:text-green-700"
                                        >
                                            Create account
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <button
                                            type="button"
                                            onClick={() => switchMode("login")}
                                            className="font-semibold text-green-600 hover:text-green-700"
                                        >
                                            Login
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginOrRegister;
