import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { cusPublicRoutes } from "./routes/route";
import DefaultLayout from "./components/layout/DefaultLayout";





import { useAppDispatch } from "./stores/hooks";
import { restoreMeThunk } from "./stores/slices/authSlice";
import ModalHost from "./components/modals/ModalHost";

function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(restoreMeThunk());
    }, [dispatch]);

    return (
            <>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    {cusPublicRoutes.map((route, index) => {
                        const ContentComp = route.component;
                        let Layouts: React.FC<{ children: React.ReactNode }> = DefaultLayout;

                        if (!route.isContent) {
                            Layouts = ({ children }) => <>{children}</>;
                        }

                        if (route.type === "CUSTOMER" || route.type === "COMMON") {
                            const element = (
                                <Layouts>
                                    <ContentComp />
                                </Layouts>
                            );

                            return (
                                <Route
                                    key={index}
                                    path={route.path}
                                    element={
                                        
                                        element
                                        
                                    }
                                />
                            );
                        }

                        return null;
                    })}
                </Routes>
            </Router>
            <ModalHost/>
        </>
    );
}

export default App;
