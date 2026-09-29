import { Toaster } from "sonner";
import Routers from "@/router";
import UserProvider from "@/context/userProvider";
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "@/styles.css";

function App() {
	return (
		<UserProvider>
			<Routers />
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
