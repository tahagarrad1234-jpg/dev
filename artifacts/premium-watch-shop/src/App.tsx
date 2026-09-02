import { useMemo, useState } from 'react';
import { Heart, Search, ShoppingBag, X, Plus, Minus, ArrowUpRight, SlidersHorizontal, ChevronDown, Watch, Sparkles } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { type ReactNode } from 'react';
import '@/index.css';

type Category = 'All pieces' | 'Dress' | 'Field' | 'Diver' | 'Chronograph';
type Product = { id: number; name: string; collection: string; category: Exclude<Category, 'All pieces'>; price: number; image: string; tone: string; description: string; };
type CartItem = Product & { quantity: number };

const queryClient = new QueryClient();

const products: Product[] = [
  { id: 1, name: 'The Meridian', collection: 'No. 01 / Automatic', category: 'Dress', price: 1240, image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200', tone: 'bone', description: 'A quietly proportioned automatic in brushed steel and warm ivory.' },
  { id: 2, name: 'Aster 38', collection: 'No. 02 / Hand-wound', category: 'Dress', price: 980, image: 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1200', tone: 'ink', description: 'A slender silhouette with a midnight dial and hand-finished indices.' },
  { id: 3, name: 'Field Note', collection: 'No. 03 / Mechanical', category: 'Field', price: 745, image: 'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1200', tone: 'olive', description: 'Built for the long way around, with a legible dial and canvas strap.' },
  { id: 4, name: 'The Deep 200', collection: 'No. 04 / Diver', category: 'Diver', price: 1680, image: 'https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1200', tone: 'rust', description: 'A disciplined tool watch with a ceramic bezel and 200m resistance.' },
  { id: 5, name: 'Civic Timer', collection: 'No. 05 / Chronograph', category: 'Chronograph', price: 1890, image: 'https://images.pexels.com/photos/47856/rolex-watch-time-luxury-47856.jpeg?auto=compress&cs=tinysrgb&w=1200', tone: 'sand', description: 'A measured chronograph for days that deserve to be remembered.' },
  { id: 6, name: 'Solstice 34', collection: 'No. 06 / Quartz', category: 'Dress', price: 590, image: 'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200', tone: 'blue', description: 'A compact everyday companion with a sun-washed blue dial.' },
];

const money = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

function Home() {
  const [category, setCategory] = useState<Category>('All pieces');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sort, setSort] = useState('Curated order');
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = products.filter((product) => (category === 'All pieces' || product.category === category) && (!term || `${product.name} ${product.category} ${product.collection}`.toLowerCase().includes(term)));
    return [...visible].sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : sort === 'Price: high to low' ? b.price - a.price : a.id - b.id);
  }, [category, search, sort]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const announce = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2400);
  };
  const toggleFavorite = (id: number) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const addToCart = (product: Product) => {
    setCart((current) => current.some((item) => item.id === product.id) ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]);
    setCartOpen(true);
    announce(`${product.name} added to your bag`);
  };
  const changeQuantity = (id: number, delta: number) => setCart((current) => current.flatMap((item) => item.id === id ? (item.quantity + delta > 0 ? [{ ...item, quantity: item.quantity + delta }] : []) : [item]));

  return (
    <div className="atelier-app">
      <div className="announcement"><span>Complimentary insured shipping on every AMAL piece</span><span className="announcement-mark">EST. 1987&nbsp;&nbsp; / &nbsp;&nbsp;GENEVA — TOKYO</span></div>
      <header className="site-header">
        <button className="mobile-toggle" aria-label="Open navigation" data-testid="button-open-navigation" onClick={() => setMobileMenu(!mobileMenu)}><span /><span /></button>
        <a href="#top" className="wordmark" data-testid="link-home"><span>A</span> AMAL</a>
        <nav className={`main-nav ${mobileMenu ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#collection" data-testid="link-collection" onClick={() => setMobileMenu(false)}>The collection</a>
          <a href="#atelier" data-testid="link-atelier" onClick={() => setMobileMenu(false)}>Our atelier</a>
          <a href="#journal" data-testid="link-journal" onClick={() => setMobileMenu(false)}>Journal</a>
        </nav>
        <div className="header-tools">
          <label className="header-search"><Search size={16} strokeWidth={1.7} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a timepiece" aria-label="Search timepieces" data-testid="input-search" /></label>
          <button className="tool-button bag-button" aria-label="Open shopping bag" data-testid="button-open-cart" onClick={() => setCartOpen(true)}><ShoppingBag size={18} strokeWidth={1.6} /><span className="bag-count">{cartCount}</span></button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> A considered collection</div>
            <h1>Keep time<br /><em>beautifully.</em></h1>
            <p>Objects of quiet precision, chosen for the stories they gather. Discover mechanical watches with a point of view.</p>
            <a href="#collection" className="hero-link" data-testid="link-explore-collection">Explore the collection <ArrowUpRight size={16} /></a>
          </div>
          <div className="hero-object" aria-label="The Meridian watch">
            <div className="hero-halo" />
            <img src={products[0].image} alt="The Meridian automatic watch" />
            <div className="hero-caption"><span>01</span><span>THE MERIDIAN / 38MM</span></div>
          </div>
          <div className="hero-side-note"><span>Scroll to browse</span><span className="vertical-rule" /></div>
        </section>

        <section className="manifesto" id="atelier">
          <div className="manifesto-index">00 / WHY AMAL</div>
          <div className="manifesto-copy"><h2>For the days<br /><em>worth marking.</em></h2><p>We look for the details that don’t ask for attention: the turn of a crown, the cool weight of steel, a dial that becomes yours over time. Every piece is selected with a patient eye.</p><a href="#journal" data-testid="link-read-story">Read our story <ArrowUpRight size={15} /></a></div>
          <div className="manifesto-stamp"><Watch size={28} strokeWidth={1} /><span>AMAL<br />OBJECTS<br />WITH A PULSE</span></div>
        </section>

        <section className="collection-section" id="collection">
          <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> The collection</div><h2>Chosen, not crowded.</h2></div><p className="section-intro">Six references. Each with its own rhythm.<br />Take your time.</p></div>
          <div className="collection-toolbar">
            <div className="category-tabs" role="tablist" aria-label="Watch categories">{(['All pieces', 'Dress', 'Field', 'Diver', 'Chronograph'] as Category[]).map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)} data-testid={`button-category-${item.toLowerCase().replace(' ', '-')}`}>{item}</button>)}</div>
            <label className="sort-select"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort collection" data-testid="select-sort"><option>Curated order</option><option>Price: low to high</option><option>Price: high to low</option></select><ChevronDown size={14} /></label>
          </div>
          {filtered.length > 0 ? <div className="product-grid">{filtered.map((product, index) => <article className={`product-card product-${index + 1}`} key={product.id} data-testid={`card-product-${product.id}`}>
            <div className={`product-image ${product.tone}`}><img src={product.image} alt={`${product.name}, ${product.category} watch`} loading="lazy" /><button className={`favorite-button ${favorites.includes(product.id) ? 'is-favorite' : ''}`} aria-label={favorites.includes(product.id) ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`} onClick={() => toggleFavorite(product.id)} data-testid={`button-favorite-${product.id}`}><Heart size={18} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button><button className="quick-add" onClick={() => addToCart(product)} data-testid={`button-add-product-${product.id}`}>Add to bag <Plus size={15} /></button></div>
            <div className="product-meta"><div><p className="product-collection">{product.collection}</p><h3>{product.name}</h3></div><strong>{money(product.price)}</strong></div>
          </article>)}</div> : <div className="empty-state"><Sparkles size={22} /><h3>Nothing found in this chapter.</h3><p>Try another search, or return to the full collection.</p><button onClick={() => { setSearch(''); setCategory('All pieces'); }} data-testid="button-clear-filters">Clear filters</button></div>}
        </section>

        <section className="craft-section" id="journal">
          <div className="craft-image"><img src={products[2].image} alt="A watch resting on a textured surface" loading="lazy" /><span className="image-label">THE AMAL STANDARD / 02</span></div>
          <div className="craft-copy"><div className="eyebrow"><span className="eyebrow-line" /> The Amal standard</div><h2>Made to be<br /><em>lived in.</em></h2><p>Small-batch makers. Honest materials. Movements you can feel. We believe a watch should wear in, not wear out.</p><div className="standard-list"><div><span>01</span><b>Serviceable movements</b><small>Built for a lifetime of keeping</small></div><div><span>02</span><b>Traceable materials</b><small>Nothing hidden behind the shine</small></div><div><span>03</span><b>Five-year guarantee</b><small>We stand behind the pieces we choose</small></div></div></div>
        </section>

        <section className="closing-note"><div className="closing-quote">“The pleasure is<br /><em>in the choosing.</em>”</div><div className="closing-details"><span>AMAL NOTES / 01</span><p>A small dispatch on watches, makers, and the rituals around time. No noise, once a month.</p><button onClick={() => announce('You are on the list')} data-testid="button-join-notes">Join the notes <ArrowUpRight size={15} /></button></div></section>
      </main>

      <footer><a href="#top" className="wordmark" data-testid="link-footer-home"><span>A</span> AMAL</a><p>Objects for keeping time.</p><div className="footer-links"><a href="#collection" data-testid="link-footer-collection">Collection</a><a href="#atelier" data-testid="link-footer-atelier">Atelier</a><button onClick={() => announce('Care team: info@amalwatches.com')} data-testid="button-contact">Contact</button></div><small>© 2024 AMAL Watches. All considered.</small></footer>

      {notice && <div className="notice" role="status" data-testid="status-notice">{notice}</div>}
      {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()} aria-label="Shopping bag"><div className="drawer-header"><div><span className="drawer-kicker">YOUR SELECTION</span><h2>Shopping bag <small>{cartCount}</small></h2></div><button onClick={() => setCartOpen(false)} aria-label="Close shopping bag" data-testid="button-close-cart"><X size={20} /></button></div>{cart.length > 0 ? <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id} data-testid={`cart-item-${item.id}`}><img src={item.image} alt="" /><div className="cart-item-info"><span>{item.collection}</span><h3>{item.name}</h3><strong>{money(item.price * item.quantity)}</strong><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`} data-testid={`button-decrease-${item.id}`}><Minus size={13} /></button><span data-testid={`text-quantity-${item.id}`}>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`} data-testid={`button-increase-${item.id}`}><Plus size={13} /></button></div></div></div>)}</div><div className="drawer-summary"><div><span>Subtotal</span><strong data-testid="text-cart-subtotal">{money(subtotal)}</strong></div><p>Shipping and taxes calculated at checkout.</p><button className="checkout-button" onClick={() => announce('Checkout is reserved for the next chapter')} data-testid="button-checkout">Continue to checkout <ArrowUpRight size={16} /></button><button className="continue-button" onClick={() => setCartOpen(false)} data-testid="button-continue-shopping">Continue browsing</button></div></> : <div className="cart-empty"><div className="empty-bag"><ShoppingBag size={25} strokeWidth={1.2} /></div><h3>Your bag is waiting.</h3><p>Begin with a piece that keeps calling you back.</p><button className="checkout-button" onClick={() => setCartOpen(false)} data-testid="button-discover-pieces">Discover the collection <ArrowUpRight size={16} /></button></div>}</aside></div>}
    </div>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={() => <div className="not-found">This page is not in the collection.</div>} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
