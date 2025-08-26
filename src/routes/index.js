import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "../components/auth/login/login";
import ForgotSelect from "../components/auth/forgot/ForgotSelect";
import ForgotCode from "../components/auth/forgot/ForgotCode";
import Register from "../components/auth/register/register";
import Home from "../pages/Home/Home";
import Profile from '../pages/Profile/Profile';
import Settings from '../pages/Setting/Settings';

const RoutesApp = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/registro" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Login />} />
                <Route path="*" element={<Login />} />
                <Route path="/esqueci-senha" element={<ForgotSelect />} />
                <Route path="/esqueci-senha/codigo" element={<ForgotCode />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings/>} />
            </Routes>
        </BrowserRouter>
    );
};

export default RoutesApp;
