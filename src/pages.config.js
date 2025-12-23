import Account from './pages/Account';
import AdminAI from './pages/AdminAI';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminBusinessPipeline from './pages/AdminBusinessPipeline';
import AdminCategories from './pages/AdminCategories';
import AdminChat from './pages/AdminChat';
import AdminCustomers from './pages/AdminCustomers';
import AdminDashboard from './pages/AdminDashboard';
import AdminDegreeOrders from './pages/AdminDegreeOrders';
import AdminHome from './pages/AdminHome';
import AdminInventory from './pages/AdminInventory';
import AdminLeads from './pages/AdminLeads';
import AdminObediences from './pages/AdminObediences';
import AdminOrders from './pages/AdminOrders';
import AdminPanel from './pages/AdminPanel';
import AdminProduction from './pages/AdminProduction';
import AdminProducts from './pages/AdminProducts';
import AdminReviews from './pages/AdminReviews';
import AdminRites from './pages/AdminRites';
import AdminSettings from './pages/AdminSettings';
import AdminStock from './pages/AdminStock';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Home from './pages/Home';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import POS from './pages/POS';
import ProductDetail from './pages/ProductDetail';
import SavedCustomizations from './pages/SavedCustomizations';
import Setup from './pages/Setup';
import Sitemap from './pages/Sitemap';
import Wishlist from './pages/Wishlist';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "AdminAI": AdminAI,
    "AdminAnalytics": AdminAnalytics,
    "AdminBusinessPipeline": AdminBusinessPipeline,
    "AdminCategories": AdminCategories,
    "AdminChat": AdminChat,
    "AdminCustomers": AdminCustomers,
    "AdminDashboard": AdminDashboard,
    "AdminDegreeOrders": AdminDegreeOrders,
    "AdminHome": AdminHome,
    "AdminInventory": AdminInventory,
    "AdminLeads": AdminLeads,
    "AdminObediences": AdminObediences,
    "AdminOrders": AdminOrders,
    "AdminPanel": AdminPanel,
    "AdminProduction": AdminProduction,
    "AdminProducts": AdminProducts,
    "AdminReviews": AdminReviews,
    "AdminRites": AdminRites,
    "AdminSettings": AdminSettings,
    "AdminStock": AdminStock,
    "Cart": Cart,
    "Catalog": Catalog,
    "Checkout": Checkout,
    "Contact": Contact,
    "Home": Home,
    "OrderConfirmation": OrderConfirmation,
    "Orders": Orders,
    "POS": POS,
    "ProductDetail": ProductDetail,
    "SavedCustomizations": SavedCustomizations,
    "Setup": Setup,
    "Sitemap": Sitemap,
    "Wishlist": Wishlist,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};