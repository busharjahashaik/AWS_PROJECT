import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useOrders } from '../../hooks';
import { MenuItem, OrderItem, Restaurant } from '../../types';
import { restaurantService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import { 
  ShoppingBag, 
  Store, 
  MapPin, 
  Phone, 
  CreditCard, 
  FileText, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

type LocationErrorCode = 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT';

class LocationError extends Error {
  constructor(public readonly code: LocationErrorCode) {
    super(code);
    this.name = 'LocationError';
  }
}

const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  if (!navigator.geolocation) {
    return Promise.reject(new LocationError('UNSUPPORTED'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => {
        const code: LocationErrorCode =
          error.code === error.PERMISSION_DENIED
            ? 'PERMISSION_DENIED'
            : error.code === error.POSITION_UNAVAILABLE
            ? 'POSITION_UNAVAILABLE'
            : 'TIMEOUT';
        reject(new LocationError(code));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
};

export const CustomerCreateOrder: React.FC = () => {
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [locationRetry, setLocationRetry] = useState(0);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuRestaurantId, setMenuRestaurantId] = useState<string | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState(false);
  const [menuRetry, setMenuRetry] = useState(0);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'UPI' | 'Cash on Delivery'>('Card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedRestaurant = restaurants.find(
    (restaurant) => restaurant.restaurantId === selectedRestaurantId
  );
  const currentMenu =
    menuRestaurantId === selectedRestaurantId ? menuItems : [];

  useEffect(() => {
    let isCurrentRequest = true;
    const findNearbyRestaurants = async () => {
      setRestaurants([]);
      setSelectedRestaurantId(null);
      setCart([]);
      setRestaurantError(null);
      setIsDetectingLocation(true);
      setIsLoadingRestaurants(false);

      try {
        const { latitude, longitude } = await getCurrentLocation();
        if (!isCurrentRequest) return;

        setIsDetectingLocation(false);
        setIsLoadingRestaurants(true);
        const responseRestaurants = await restaurantService.getNearbyRestaurants(
          latitude,
          longitude,
          10
        );
        if (!isCurrentRequest) return;

        const restaurantsArray = Array.isArray(responseRestaurants)
          ? responseRestaurants
          : [];
        setRestaurants(restaurantsArray);
        setSelectedRestaurantId(restaurantsArray[0]?.restaurantId ?? null);
      } catch (error) {
        if (!isCurrentRequest) return;
        if (error instanceof LocationError) {
          const messages: Record<LocationErrorCode, string> = {
            UNSUPPORTED: 'Location is not supported by this browser. Please use a browser that supports location access.',
            PERMISSION_DENIED: 'Location permission was denied. Please allow location access to find nearby restaurants.',
            POSITION_UNAVAILABLE: 'Your current location is unavailable. Check your device location settings and try again.',
            TIMEOUT: 'Location detection timed out. Please try again.',
          };
          setRestaurantError(messages[error.code]);
        } else {
          setRestaurantError('Unable to load nearby restaurants. Please try again.');
        }
      } finally {
        if (isCurrentRequest) {
          setIsDetectingLocation(false);
          setIsLoadingRestaurants(false);
        }
      }
    };

    void findNearbyRestaurants();

    return () => {
      isCurrentRequest = false;
    };
  }, [locationRetry]);

  useEffect(() => {
    let isCurrentRequest = true;
    setMenuItems([]);
    setMenuRestaurantId(null);
    setMenuError(false);

    if (!selectedRestaurantId) {
      setIsLoadingMenu(false);
      return () => {
        isCurrentRequest = false;
      };
    }

    setIsLoadingMenu(true);
    restaurantService
      .getMenu(selectedRestaurantId)
      .then((items) => {
        if (!isCurrentRequest) return;
        const restaurantMenu = items.filter(
          (item) => item.restaurantId === selectedRestaurantId
        );
        setMenuItems(restaurantMenu);
        setCart((currentCart) =>
          currentCart.flatMap((entry) => {
            const latestItem = restaurantMenu.find(
              (item) => item.itemId === entry.item.itemId && item.isAvailable
            );
            return latestItem ? [{ ...entry, item: latestItem }] : [];
          })
        );
        setMenuRestaurantId(selectedRestaurantId);
      })
      .catch(() => {
        if (isCurrentRequest) setMenuError(true);
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingMenu(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedRestaurantId, menuRetry]);

  const handleAddItem = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.itemId === menuItem.itemId);
      if (existing) {
        return prev.map((c) =>
          c.item.itemId === menuItem.itemId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item: menuItem, quantity: 1 }];
    });
  };

  const handleDecreaseItem = (itemId: string) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.itemId !== itemId));
  };

  const handleSwitchRestaurant = (restaurant: Restaurant) => {
    if (restaurant.restaurantId !== selectedRestaurantId) {
      if (cart.length > 0) {
        if (window.confirm('Switching restaurants will reset your current basket. Proceed?')) {
          setSelectedRestaurantId(restaurant.restaurantId);
          setCart([]);
        }
      } else {
        setSelectedRestaurantId(restaurant.restaurantId);
      }
    }
  };

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const deliveryFee = cart.length > 0 ? 4.99 : 0;
  const totalAmount = subtotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedRestaurant || cart.length === 0) {
      setErrorMsg('Please select at least one item from the menu.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setErrorMsg('Please enter a delivery address.');
      return;
    }

    if (!contactNumber.trim()) {
      setErrorMsg('Please enter your contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems: OrderItem[] = cart.map((c) => ({
        id: c.item.itemId,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        category: c.item.category,
      }));

      const newOrder = await createOrder({
        restaurantId: selectedRestaurant.restaurantId,
        restaurant: selectedRestaurant.name,
        items: orderItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        deliveryFee: parseFloat(deliveryFee.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        deliveryAddress: deliveryAddress.trim(),
        contactNumber: contactNumber.trim(),
        customerPhone: contactNumber.trim(),
        paymentMethod,
        specialInstructions: deliveryInstructions.trim(),
      });

      setSuccessMsg(`Order ${newOrder.orderId} created successfully! Redirecting to tracking...`);
      setCart([]);

      // Navigate to order details page after brief delay
      setTimeout(() => {
        navigate(`/customer/orders/${newOrder.orderId}`);
      }, 700);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to place order. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 mb-1.5">
            <Store className="w-3.5 h-3.5" />
            <span>Customer Portal • Food & Goods Ordering</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Order</h1>
          <p className="text-xs text-slate-500">
            Select a store, choose menu items, and place your order with real-time status broadcasting.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Restaurant Selector Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          1. Select Restaurant / Store
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className={`text-xs ${restaurantError ? 'text-rose-700' : 'text-slate-500'}`}>
            {isDetectingLocation || isLoadingRestaurants
              ? ''
              : restaurantError || 'Restaurants near your current location'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDetectingLocation || isLoadingRestaurants}
            onClick={() => setLocationRetry((attempt) => attempt + 1)}
          >
            {isDetectingLocation
              ? 'Detecting your location...'
              : isLoadingRestaurants
              ? 'Finding nearby restaurants...'
              : 'Use My Current Location'}
          </Button>
        </div>
        {isDetectingLocation || isLoadingRestaurants ? (
          <p className="text-xs text-slate-500">
            {isDetectingLocation ? 'Detecting your location...' : 'Finding nearby restaurants...'}
          </p>
        ) : restaurantError ? (
          <div className="flex items-center justify-between gap-3 text-xs text-rose-700">
            <span>{restaurantError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLocationRetry((attempt) => attempt + 1)}
            >
              Try Again
            </Button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>No restaurants available.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLocationRetry((attempt) => attempt + 1)}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {restaurants.map((restaurant) => {
              const isSelected = restaurant.restaurantId === selectedRestaurantId;
              return (
                <button
                  key={restaurant.restaurantId}
                  type="button"
                  onClick={() => handleSwitchRestaurant(restaurant)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {restaurant.image ? (
                      <img
                        src={restaurant.image}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Store className="w-7 h-7 text-indigo-500" />
                    )}
                    {typeof restaurant.distanceKm === 'number' && (
                      <span className="text-[10px] text-slate-500">
                        {restaurant.distanceKm.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{restaurant.name}</h4>
                  {(restaurant.location || restaurant.address) && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {restaurant.location || restaurant.address}
                    </p>
                  )}
                  {restaurant.location && restaurant.address && (
                    <p className="text-[10px] text-slate-400 mt-1">{restaurant.address}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedRestaurant ? `${selectedRestaurant.name} Menu` : 'Restaurant Menu'}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedRestaurant?.description || selectedRestaurant?.address}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {isLoadingMenu ? 'Loading menu...' : `${currentMenu.length} items available`}
              </span>
            </div>

            {menuError ? (
              <div className="flex items-center justify-between gap-3 text-xs text-rose-700">
                <span>Unable to load data. Please try again.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMenuRetry((attempt) => attempt + 1)}
                >
                  Retry
                </Button>
              </div>
            ) : isLoadingMenu ? (
              <p className="text-xs text-slate-500">Loading menu...</p>
            ) : !selectedRestaurant ? (
              <p className="text-xs text-slate-500">Select a restaurant to view its menu.</p>
            ) : currentMenu.length === 0 ? (
              <p className="text-xs text-slate-500">No menu items available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentMenu.map((menuItem) => {
                const cartEntry = cart.find((c) => c.item.itemId === menuItem.itemId);
                const quantity = cartEntry ? cartEntry.quantity : 0;

                return (
                  <div
                    key={menuItem.itemId}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between bg-white"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        {menuItem.image ? (
                          <img
                            src={menuItem.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-2xl" aria-hidden="true">🍽️</span>
                        )}
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {formatCurrency(menuItem.price)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-2">{menuItem.name}</h4>
                      {menuItem.category && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Category: {menuItem.category}</p>
                      )}
                      {menuItem.description && (
                        <p className="text-[11px] text-slate-500 mt-1">{menuItem.description}</p>
                      )}
                      <p className={`text-[10px] font-semibold mt-2 ${menuItem.isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {menuItem.isAvailable ? 'Available' : 'Unavailable'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {quantity > 0 && menuItem.isAvailable ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecreaseItem(menuItem.itemId)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-slate-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddItem(menuItem)}
                            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-bold text-xs transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-semibold hover:border-indigo-600 hover:text-indigo-600"
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => handleAddItem(menuItem)}
                          disabled={!menuItem.isAvailable}
                        >
                          {menuItem.isAvailable ? 'Add to Order' : 'Unavailable'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary & Checkout Form (1 Col) */}
        <div className="space-y-4">
          <form onSubmit={handleSubmitOrder} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-normal text-slate-500">
                {cart.reduce((sum, c) => sum + c.quantity, 0)} items
              </span>
            </h3>

            {/* Cart Items */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Your basket is empty. Select items from the menu.
                </div>
              ) : (
                cart.map((c) => (
                  <div
                    key={c.item.itemId}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-800 truncate">{c.item.name}</span>
                      <span className="text-slate-400 text-[11px]">x{c.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(c.item.price * c.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(c.item.itemId)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-mono font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="font-mono text-indigo-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Delivery Address
              </label>
              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street address, building, floor, city..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                Contact Phone
              </label>
              <input
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Enter contact phone number"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Delivery Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Leave with concierge, gate code #104"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Card', 'UPI', 'Cash on Delivery'] as const).map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Place Order CTA */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={cart.length === 0}
                isLoading={isSubmitting}
                className="w-full justify-center text-sm font-bold shadow-md shadow-indigo-500/20"
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                {isSubmitting ? 'Placing order...' : `Place Order (${formatCurrency(totalAmount)})`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
