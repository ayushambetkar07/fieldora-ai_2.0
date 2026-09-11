import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Wheat, 
  LayoutDashboard, 
  PlusCircle, 
  PackageCheck, 
  TrendingUp, 
  ClipboardList, 
  Inbox, 
  Store, 
  User, 
  X,
  Settings,
  Bell,
  MessageSquare,
  Truck
} from 'lucide-react';
import { cn } from '../ui';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { userRole, currentFarmer, currentBuyer } = useApp();

  const farmerNav = [
    { label: 'Dashboard', path: '/farmer/dashboard', icon: LayoutDashboard },
    { label: 'My Products', path: '/farmer/produce', icon: Wheat },
    { label: 'Add Product', path: '/farmer/produce/new', icon: PlusCircle },
    { label: 'Orders', path: '/farmer/orders', icon: PackageCheck },
    { label: 'Smart Transport', path: '/farmer/transport', icon: Truck },
    { label: 'Market Prices', path: '/farmer/market-prices', icon: TrendingUp },
    { label: 'Buyer Requests', path: '/farmer/requests', icon: Inbox },
    { label: 'Requirements', path: '/farmer/requirements', icon: ClipboardList },
  ];

  const buyerNav = [
    { label: 'Dashboard', path: '/buyer/dashboard', icon: LayoutDashboard },
    { label: 'Marketplace', path: '/buyer/marketplace', icon: Store },
    { label: 'Smart Transport', path: '/buyer/transport', icon: Truck },
    { label: 'My Requirements', path: '/buyer/requirements', icon: ClipboardList },
    { label: 'Post Requirement', path: '/buyer/requirements/new', icon: PlusCircle },
    { label: 'Orders & Escrow', path: '/buyer/orders', icon: PackageCheck },
  ];

  const navItems = userRole === 'farmer' ? farmerNav : buyerNav;

  return (
    <aside className="w-64 h-full bg-white border-r border-[#EAEFEA] flex flex-col justify-between p-4 selection:bg-primary selection:text-white">
      
      <div className="space-y-6">
        
        {/* Brand Logo from Reference */}
        <div className="flex items-center justify-between px-2 pt-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#166534] flex items-center justify-center text-white shadow-xs">
              <Wheat className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl text-main tracking-tight block leading-none">
                Fieldora
              </span>
              <span className="text-[10px] text-secondary font-semibold block mt-0.5">
                {userRole === 'farmer' ? 'Farmer Portal' : 'Buyer Portal'}
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="p-1 rounded text-secondary hover:text-main md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items (Green rounded active pill from Reference) */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-input text-xs font-semibold transition-all",
                isActive
                  ? "bg-[#E8F3EB] text-[#166534] font-bold shadow-2xs"
                  : "text-secondary hover:bg-[#F7F8F3] hover:text-main"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

      </div>

      {/* Bottom Profile Section */}
      <div className="pt-4 border-t border-[#EAEFEA] space-y-2">
        <NavLink
          to={userRole === 'farmer' ? '/farmer/profile' : '/buyer/profile'}
          onClick={onCloseMobile}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-input text-xs transition-colors",
            isActive ? "bg-[#E8F3EB] text-[#166534] font-bold" : "text-secondary hover:bg-[#F7F8F3] hover:text-main"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-[#166534] text-[#22C55E] flex items-center justify-center text-[10px] font-bold shrink-0">
            {userRole === 'farmer' ? 'RP' : 'SD'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-main truncate text-xs">
              {userRole === 'farmer' ? currentFarmer.name : currentBuyer.companyName}
            </div>
            <div className="text-[10px] text-secondary truncate">
              {userRole === 'farmer' ? currentFarmer.location : currentBuyer.name}
            </div>
          </div>
        </NavLink>
      </div>

    </aside>
  );
};
