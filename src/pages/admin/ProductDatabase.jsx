import React, { useState, useContext } from 'react';
import { ProductContext } from '../../context/ProductContext';
import { sanitizeInput, cloakUrl, uncloakUrl } from '../../utils/security';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  PlusCircle, 
  Trash, 
  DollarSign, 
  FileImage, 
  ExternalLink 
} from 'lucide-react';

const getSessionUser = () => {
  try {
    const session = sessionStorage.getItem('wc_admin_session');
    return session ? JSON.parse(session) : null;
  } catch(e) {
    return null;
  }
};

export default function ProductDatabase() {
  const { products, addProduct, updateProduct, deleteProduct } = useContext(ProductContext);
  const sessionUser = getSessionUser();
  const isReadOnly = sessionUser && sessionUser.role === 'staff_writer';
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating new product

  // Category Mapping Configuration
  const categoryMap = {
    "Prime Day": ["Deals", "Buying Guides"],
    "Home & Garden": ["Vacuum Cleaners", "Laundry", "Bathroom", "Garden & Outdoors", "Heating, Cooling, & Air Quality", "Cleaning Supplies"],
    "Kitchen": ["Cookware", "Small Appliances", "Large Appliances", "Coffee & Tea", "Knives & Prep", "Bakeware"],
    "Health & Lifestyle": ["Exercise Gear", "Skincare", "Grooming", "Oral Care", "Wellness"],
    "Tech": ["Computers & Laptops", "Headphones", "Phones", "TVs", "Smart Home", "Cables & Accessories"],
    "Baby & Kid": ["Strollers", "Car Seats", "Toys", "Diapering", "Nursery"],
    "Style": ["Shoes", "Clothing", "Socks", "Activewear"],
    "Gifts": ["For Her", "For Him", "For Kids", "Under $50", "Wirecutter Store"]
  };

  // Form State
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    sku: '',
    basePrice: '',
    image: '',
    category: 'Home & Garden',
    subCategory: 'Vacuum Cleaners',
    affiliateLinks: [{ retailer: 'Amazon', link: '' }]
  });

  const handleEditClick = (prod) => {
    setEditingId(prod.id);
    const pCat = prod.category || 'Home & Garden';
    const pSub = prod.subCategory || (categoryMap[pCat]?.[0] || '');
    setProductForm({
      id: prod.id,
      name: prod.name,
      sku: prod.sku || '',
      basePrice: prod.basePrice || '',
      image: prod.image || '',
      category: pCat,
      subCategory: pSub,
      affiliateLinks: prod.affiliateLinks && prod.affiliateLinks.length > 0 
        ? prod.affiliateLinks.map(l => ({ ...l, link: uncloakUrl(l.link) }))
        : [{ retailer: 'Amazon', link: '' }]
    });
    setIsEditing(true);
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setProductForm({
      id: `PROD-${Date.now().toString().slice(-4)}`,
      name: '',
      sku: '',
      basePrice: '',
      image: '',
      category: 'Home & Garden',
      subCategory: 'Vacuum Cleaners',
      affiliateLinks: [{ retailer: 'Amazon', link: '' }]
    });
    setIsEditing(true);
  };

  const handleAddLinkRow = () => {
    setProductForm(prev => ({
      ...prev,
      affiliateLinks: [...prev.affiliateLinks, { retailer: '', link: '' }]
    }));
  };

  const handleRemoveLinkRow = (idx) => {
    setProductForm(prev => {
      const copy = [...prev.affiliateLinks];
      copy.splice(idx, 1);
      return {
        ...prev,
        affiliateLinks: copy.length === 0 ? [{ retailer: '', link: '' }] : copy
      };
    });
  };

  const handleLinkRowChange = (idx, field, value) => {
    setProductForm(prev => {
      const copy = [...prev.affiliateLinks];
      copy[idx] = { ...copy[idx], [field]: value };
      return {
        ...prev,
        affiliateLinks: copy
      };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isReadOnly) {
      alert("Bank-grade Security Alert: Access Denied. Your role 'staff_writer' is restricted to read-only access. Write/Edit operations are forbidden.");
      return;
    }

    const cleanForm = {
      ...productForm,
      name: sanitizeInput(productForm.name),
      sku: sanitizeInput(productForm.sku),
      basePrice: productForm.basePrice.startsWith('$') ? productForm.basePrice : `$${productForm.basePrice}`,
      affiliateLinks: productForm.affiliateLinks
        .filter(l => l.retailer.trim())
        .map(l => ({
          retailer: sanitizeInput(l.retailer),
          link: cloakUrl(l.link)
        }))
    };

    if (editingId) {
      updateProduct(cleanForm);
    } else {
      addProduct(cleanForm);
    }
    setIsEditing(false);
  };

  const handleDeleteClick = (id) => {
    if (isReadOnly) {
      alert("Bank-grade Security Alert: Access Denied. Your role 'staff_writer' is restricted to read-only access. Delete operations are forbidden.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this product? All articles linking this product ID will lose its link.")) {
      deleteProduct(id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Database</h1>
          <p className="text-xs text-slate-500 mt-1">Manage core product entries, base pricing tables, and multi-retailer affiliate link pools.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {isReadOnly && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️ Read-Only Protection Active: Your current session role is 'Staff Writer'. Database modifications are locked.</span>
        </div>
      )}

      {isEditing ? (
        /* Edit/Create Form View */
        <form onSubmit={handleFormSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingId ? `Modify Product [${editingId}]` : 'Register New Product'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Define core catalog features and associate commission channels.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Product ID</label>
              <input
                type="text"
                required
                disabled={editingId !== null}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-400 bg-slate-50/50"
                value={productForm.id}
                onChange={(e) => setProductForm(prev => ({ ...prev, id: e.target.value }))}
                placeholder="PROD-001"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Product Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Dyson V15 Detect Cordless Vacuum"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">SKU / Model Code</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                value={productForm.sku}
                onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g. DYSON-V15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Product Image Path / URL</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                value={productForm.image}
                onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="e.g. https://images.unsplash.com/... or /images/product.png"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Base Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                <input
                  type="text"
                  required
                  className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-slate-400 text-reviewsmart-brand"
                  value={productForm.basePrice.replace('$', '')}
                  onChange={(e) => setProductForm(prev => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="249.99"
                />
              </div>
            </div>
          </div>

          {/* Horizontally aligned Category & Sub-category selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Category</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 bg-white font-medium"
                value={productForm.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const firstSub = categoryMap[cat]?.[0] || '';
                  setProductForm(prev => ({ ...prev, category: cat, subCategory: firstSub }));
                }}
              >
                {Object.keys(categoryMap).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Sub-category</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 bg-white font-medium"
                value={productForm.subCategory}
                onChange={(e) => setProductForm(prev => ({ ...prev, subCategory: e.target.value }))}
              >
                {(categoryMap[productForm.category] || []).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic links */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">Multi-Retailer Affiliate link list</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Map this product entity to multiple partner affiliate links.</p>
              </div>
              <button
                type="button"
                onClick={handleAddLinkRow}
                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded transition uppercase tracking-wide"
              >
                <PlusCircle size={12} />
                <span>Add Affiliate Link</span>
              </button>
            </div>

            <div className="space-y-2">
              {productForm.affiliateLinks.map((linkObj, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="w-1/4 font-semibold">
                    <input
                      type="text"
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs"
                      placeholder="Retailer (e.g. Lazada)"
                      value={linkObj.retailer}
                      onChange={(e) => handleLinkRowChange(idx, 'retailer', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs font-mono"
                      placeholder="Affiliate URL"
                      value={linkObj.link}
                      onChange={(e) => handleLinkRowChange(idx, 'link', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLinkRow(idx)}
                    className="p-2 border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded transition"
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition"
            >
              <Save size={14} />
              <span>Save Product</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold px-5 py-2.5 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Products List Table View */
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search products by SKU, title, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 bg-slate-50/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-5 w-28">Product ID</th>
                    <th className="py-4 px-5 w-20">Image</th>
                    <th className="py-4 px-5 min-w-[280px]">Product details & SKU</th>
                    <th className="py-4 px-5 w-28 text-right">Price</th>
                    <th className="py-4 px-5 min-w-[200px]">Commission Channels</th>
                    <th className="py-4 px-5 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 font-mono text-[10px] text-slate-400 font-medium">
                          {prod.id}
                        </td>
                        <td className="py-4 px-5">
                          <div className="h-10 w-10 bg-slate-50 rounded border border-slate-100 flex items-center justify-center p-1">
                            <img 
                              src={prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'} 
                              alt={prod.name}
                              className="max-h-full object-contain"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'; }}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{prod.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            SKU: {prod.sku || 'N/A'} • <span className="font-semibold text-slate-500">{prod.category || 'Home & Garden'}</span> &gt; <span className="text-slate-400">{prod.subCategory || 'Vacuum Cleaners'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right font-black text-reviewsmart-brand">
                          {prod.basePrice}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1">
                            {prod.affiliateLinks && prod.affiliateLinks.length > 0 ? (
                              prod.affiliateLinks.map((linkObj, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold"
                                >
                                  {linkObj.retailer}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No affiliate channels</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleEditClick(prod)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-950 transition-colors"
                              title="Edit product parameters"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(prod.id)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete product entity"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                        No product entries matched your search parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
