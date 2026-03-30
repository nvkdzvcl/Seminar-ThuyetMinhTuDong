import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { cusPublicRoutes, routePath } from "./routes/route";
import DefaultLayout from "./components/layout/DefaultLayout";
import { useAppDispatch } from "./stores/hooks";
import { restoreMeThunk } from "./stores/slices/authSlice";
import ModalHost from "./components/modals/ModalHost";
import { useAutoUiTranslation } from "./hooks/useAutoUiTranslation";

const LS_ACCESS = "VINH_KHANH_FOOD_TOUR_ACCESS_TOKEN";

function AppRoutes() {
    useAutoUiTranslation();
    const hasAccessToken = Boolean(localStorage.getItem(LS_ACCESS));

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Navigate
                        to={hasAccessToken ? routePath.HomeDishPage : routePath.login}
                        replace
                    />
                }
            />
            {cusPublicRoutes.map((route, index) => {
                const ContentComp = route.component;
                let Layouts: React.FC<{ children: React.ReactNode }> = DefaultLayout;

                if (!route.isContent) {
                    Layouts = ({ children }) => <>{children}</>;
                }

                if (route.type === "CUSTOMER" || route.type === "COMMON") {
                    const content = (
                        <Layouts>
                            <ContentComp />
                        </Layouts>
                    );

                    const isLoginRoute = route.path === routePath.login;
                    let element = content;

                    if (isLoginRoute && hasAccessToken) {
                        element = <Navigate to={routePath.HomeDishPage} replace />;
                    }

                    if (!isLoginRoute && !hasAccessToken) {
                        element = <Navigate to={routePath.login} replace />;
                    }

                    return <Route key={index} path={route.path} element={element} />;
                }

                return null;
            })}
            <Route
                path="*"
                element={
                    <Navigate
                        to={hasAccessToken ? routePath.HomeDishPage : routePath.login}
                        replace
                    />
                }
            />
        </Routes>
    );
}

function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(restoreMeThunk());
    }, [dispatch]);

    return (
        <>
            <Router>
                <AppRoutes />
            </Router>
            <ModalHost />
        </>
    );
}

export default App;
