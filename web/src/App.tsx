import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "@/router";
import { Seo } from "@/components/seo";
import UserProvider from "@/context/userProvider";
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "@/styles.css";

function App() {
	return (
		<UserProvider>
            <Seo router={router} />
            <RouterProvider router={router} />
            <Toaster position="bottom-right" />
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
            />
        </UserProvider>
	);
}

export default App;
