import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Account from './pages/Account';
import AdminOrders from './pages/AdminOrders';
import AdminSettings from './pages/AdminSettings';
import AdminDashboard from './pages/AdminDashboard';
import SavedCustomizations from './pages/SavedCustomizations';
import AdminProducts from './pages/AdminProducts';
import AdminCustomers from './pages/AdminCustomers';
import AdminProduction from './pages/AdminProduction';
import AdminRites from './pages/AdminRites';
import AdminStock from './pages/AdminStock';
import Contact from './pages/Contact';
import AdminReviews from './pages/AdminReviews';
import Sitemap from './pages/Sitemap';
import AdminPanel from './pages/AdminPanel';
import Setup from './pages/Setup';
import AdminAI from './pages/AdminAI';
import Wishlist from './pages/Wishlist';
import AdminObediences from './pages/AdminObediences';
import AdminDegreeOrders from './pages/AdminDegreeOrders';
import AdminHome from './pages/AdminHome';
import AdminLeads from './pages/AdminLeads';
import AdminAnalytics from './pages/AdminAnalytics';
import POS from './pages/POS';
import AdminInventory from './pages/AdminInventory';
import AdminCategories from './pages/AdminCategories';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Catalog": Catalog,
    "ProductDetail": ProductDetail,
    "Cart": Cart,
    "Checkout": Checkout,
    "Orders": Orders,
    "Account": Account,
    "AdminOrders": AdminOrders,
    "AdminSettings": AdminSettings,
    "AdminDashboard": AdminDashboard,
    "SavedCustomizations": SavedCustomizations,
    "AdminProducts": AdminProducts,
    "AdminCustomers": AdminCustomers,
    "AdminProduction": AdminProduction,
    "AdminRites": AdminRites,
    "AdminStock": AdminStock,
    "Contact": Contact,
    "AdminReviews": AdminReviews,
    "Sitemap": Sitemap,
    "AdminPanel": AdminPanel,
    "Setup": Setup,
    "AdminAI": AdminAI,
    "Wishlist": Wishlist,
    "AdminObediences": AdminObediences,
    "AdminDegreeOrders": AdminDegreeOrders,
    "AdminHome": AdminHome,
    "AdminLeads": AdminLeads,
    "AdminAnalytics": AdminAnalytics,
    "POS": POS,
    "AdminInventory": AdminInventory,
    "AdminCategories": AdminCategories,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};