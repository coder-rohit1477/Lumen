#!/usr/bin/env python3
"""
Comprehensive backend API tests for Lumen Commerce
Tests all endpoints: health, categories, products, auth, orders, coupons, reviews, admin
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://shop-engine-41.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name: str, details: str = ""):
        self.passed.append(f"✅ {test_name}" + (f": {details}" if details else ""))
        print(f"✅ PASS: {test_name}" + (f" - {details}" if details else ""))
    
    def add_fail(self, test_name: str, details: str):
        self.failed.append(f"❌ {test_name}: {details}")
        print(f"❌ FAIL: {test_name}: {details}")
    
    def add_warning(self, test_name: str, details: str):
        self.warnings.append(f"⚠️  {test_name}: {details}")
        print(f"⚠️  WARNING: {test_name}: {details}")
    
    def summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Passed: {len(self.passed)}")
        print(f"Failed: {len(self.failed)}")
        print(f"Warnings: {len(self.warnings)}")
        
        if self.failed:
            print("\n❌ FAILED TESTS:")
            for f in self.failed:
                print(f"  {f}")
        
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for w in self.warnings:
                print(f"  {w}")
        
        print("="*80)
        return len(self.failed) == 0

results = TestResults()

# Global variables for test data
admin_token = None
customer_token = None
customer_email = None
test_product_id = None
test_order_id = None
created_product_id = None

def test_health():
    """Test 1: Health check endpoint"""
    print("\n" + "="*80)
    print("TEST 1: Health Check")
    print("="*80)
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('ok') == True and 'Lumen Commerce API' in data.get('message', ''):
            results.add_pass("Health check", f"API is running: {data.get('message')}")
            return True
        else:
            results.add_fail("Health check", f"Unexpected response: {data}")
            return False
    except Exception as e:
        results.add_fail("Health check", f"Exception: {str(e)}")
        return False

def test_categories():
    """Test 2: Categories endpoint"""
    print("\n" + "="*80)
    print("TEST 2: Categories")
    print("="*80)
    try:
        response = requests.get(f"{BASE_URL}/categories", timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Categories list", f"Status {response.status_code}: {data}")
            return False
        
        if not isinstance(data, list):
            results.add_fail("Categories list", f"Expected array, got: {type(data)}")
            return False
        
        if len(data) != 6:
            results.add_fail("Categories count", f"Expected 6 categories, got {len(data)}")
            return False
        
        # Check structure
        required_fields = ['id', 'slug', 'name', 'image']
        for cat in data:
            missing = [f for f in required_fields if f not in cat]
            if missing:
                results.add_fail("Category structure", f"Missing fields: {missing}")
                return False
        
        results.add_pass("Categories", f"Got {len(data)} categories with correct structure")
        return True
    except Exception as e:
        results.add_fail("Categories", f"Exception: {str(e)}")
        return False

def test_products():
    """Test 3: Products list with various filters"""
    print("\n" + "="*80)
    print("TEST 3: Products List & Filters")
    print("="*80)
    global test_product_id
    
    try:
        # 3a: Basic products list
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Products list", f"Status {response.status_code}: {data}")
            return False
        
        if 'items' not in data or 'total' not in data:
            results.add_fail("Products list", f"Missing items or total: {data.keys()}")
            return False
        
        if data['total'] != 12:
            results.add_fail("Products count", f"Expected 12 products, got {data['total']}")
            return False
        
        results.add_pass("Products list", f"Got {data['total']} products")
        
        # Store a product ID for later tests
        if data['items']:
            test_product_id = data['items'][0]['id']
        
        # 3b: Featured products
        response = requests.get(f"{BASE_URL}/products?featured=1", timeout=10)
        data = response.json()
        if response.status_code == 200:
            featured_count = len(data.get('items', []))
            if featured_count >= 5:
                results.add_pass("Featured products", f"Got {featured_count} featured products")
            else:
                results.add_fail("Featured products", f"Expected ≥5, got {featured_count}")
        else:
            results.add_fail("Featured products", f"Status {response.status_code}")
        
        # 3c: Best sellers
        response = requests.get(f"{BASE_URL}/products?bestSeller=1", timeout=10)
        data = response.json()
        if response.status_code == 200:
            bs_count = len(data.get('items', []))
            if bs_count >= 4:
                results.add_pass("Best seller products", f"Got {bs_count} best sellers")
            else:
                results.add_fail("Best seller products", f"Expected ≥4, got {bs_count}")
        else:
            results.add_fail("Best seller products", f"Status {response.status_code}")
        
        # 3d: New arrivals
        response = requests.get(f"{BASE_URL}/products?newArrival=1", timeout=10)
        data = response.json()
        if response.status_code == 200:
            na_count = len(data.get('items', []))
            if na_count >= 4:
                results.add_pass("New arrival products", f"Got {na_count} new arrivals")
            else:
                results.add_fail("New arrival products", f"Expected ≥4, got {na_count}")
        else:
            results.add_fail("New arrival products", f"Status {response.status_code}")
        
        # 3e: Category filter
        response = requests.get(f"{BASE_URL}/products?category=men", timeout=10)
        data = response.json()
        if response.status_code == 200:
            items = data.get('items', [])
            all_men = all(item.get('category') == 'men' for item in items)
            if all_men and len(items) > 0:
                results.add_pass("Category filter", f"Got {len(items)} men's products")
            else:
                results.add_fail("Category filter", f"Category filter not working correctly")
        else:
            results.add_fail("Category filter", f"Status {response.status_code}")
        
        # 3f: Search query
        response = requests.get(f"{BASE_URL}/products?q=watch", timeout=10)
        data = response.json()
        if response.status_code == 200:
            items = data.get('items', [])
            has_watch = any('watch' in item.get('name', '').lower() for item in items)
            if has_watch:
                results.add_pass("Search query", f"Found {len(items)} products matching 'watch'")
            else:
                results.add_fail("Search query", f"No products found matching 'watch'")
        else:
            results.add_fail("Search query", f"Status {response.status_code}")
        
        # 3g: Price range and sort
        response = requests.get(f"{BASE_URL}/products?min=2000&max=5000&sort=price-asc", timeout=10)
        data = response.json()
        if response.status_code == 200:
            items = data.get('items', [])
            in_range = all(2000 <= item.get('price', 0) <= 5000 for item in items)
            is_sorted = all(items[i]['price'] <= items[i+1]['price'] for i in range(len(items)-1)) if len(items) > 1 else True
            if in_range and is_sorted:
                results.add_pass("Price range & sort", f"Got {len(items)} products in range, sorted ascending")
            else:
                results.add_fail("Price range & sort", f"Range or sort not working correctly")
        else:
            results.add_fail("Price range & sort", f"Status {response.status_code}")
        
        # 3h: Other sort options
        for sort_type in ['price-desc', 'rating', 'new', 'featured']:
            response = requests.get(f"{BASE_URL}/products?sort={sort_type}", timeout=10)
            if response.status_code == 200:
                results.add_pass(f"Sort {sort_type}", "Working")
            else:
                results.add_fail(f"Sort {sort_type}", f"Status {response.status_code}")
        
        return True
    except Exception as e:
        results.add_fail("Products", f"Exception: {str(e)}")
        return False

def test_product_detail():
    """Test 4: Product detail by slug"""
    print("\n" + "="*80)
    print("TEST 4: Product Detail")
    print("="*80)
    try:
        # 4a: Valid product slug
        response = requests.get(f"{BASE_URL}/products/heritage-leather-watch", timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Product detail", f"Status {response.status_code}: {data}")
            return False
        
        if 'product' not in data or 'related' not in data or 'reviews' not in data:
            results.add_fail("Product detail", f"Missing required fields: {data.keys()}")
            return False
        
        related_count = len(data['related'])
        if related_count > 4:
            results.add_fail("Product detail", f"Related products should be ≤4, got {related_count}")
        else:
            results.add_pass("Product detail", f"Got product with {related_count} related items")
        
        # 4b: Non-existent slug
        response = requests.get(f"{BASE_URL}/products/non-existent-slug-xyz", timeout=10)
        if response.status_code == 404:
            results.add_pass("Product 404", "Correctly returns 404 for non-existent product")
        else:
            results.add_fail("Product 404", f"Expected 404, got {response.status_code}")
        
        return True
    except Exception as e:
        results.add_fail("Product detail", f"Exception: {str(e)}")
        return False

def test_auth():
    """Test 5: Auth flow (register, login, me)"""
    print("\n" + "="*80)
    print("TEST 5: Authentication")
    print("="*80)
    global admin_token, customer_token, customer_email
    
    try:
        # 5a: Register new customer
        import time
        customer_email = f"testcustomer{int(time.time())}@test.com"
        register_data = {
            "name": "Test Customer",
            "email": customer_email,
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Register", f"Status {response.status_code}: {data}")
            return False
        
        if 'token' not in data or 'user' not in data:
            results.add_fail("Register", f"Missing token or user: {data.keys()}")
            return False
        
        if data['user'].get('role') != 'customer':
            results.add_fail("Register", f"Expected role=customer, got {data['user'].get('role')}")
            return False
        
        customer_token = data['token']
        results.add_pass("Register", f"Created customer account: {customer_email}")
        
        # 5b: Register with same email (should fail)
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data, timeout=10)
        if response.status_code == 400:
            data = response.json()
            if 'already registered' in data.get('error', '').lower():
                results.add_pass("Register duplicate", "Correctly rejects duplicate email")
            else:
                results.add_fail("Register duplicate", f"Wrong error message: {data.get('error')}")
        else:
            results.add_fail("Register duplicate", f"Expected 400, got {response.status_code}")
        
        # 5c: Login with wrong password
        login_data = {"email": customer_email, "password": "wrongpassword"}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        if response.status_code == 401:
            results.add_pass("Login wrong password", "Correctly rejects wrong password")
        else:
            results.add_fail("Login wrong password", f"Expected 401, got {response.status_code}")
        
        # 5d: Login admin
        admin_login = {"email": "admin@lumen.shop", "password": "admin123"}
        response = requests.post(f"{BASE_URL}/auth/login", json=admin_login, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Admin login", f"Status {response.status_code}: {data}")
            return False
        
        if 'token' not in data or data.get('user', {}).get('role') != 'admin':
            results.add_fail("Admin login", f"Expected admin role, got: {data.get('user', {}).get('role')}")
            return False
        
        admin_token = data['token']
        results.add_pass("Admin login", "Successfully logged in as admin")
        
        # 5e: GET /auth/me with token
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and 'user' in data:
            results.add_pass("Auth me with token", f"Got user: {data['user'].get('email')}")
        else:
            results.add_fail("Auth me with token", f"Status {response.status_code}: {data}")
        
        # 5f: GET /auth/me without token
        response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        if response.status_code == 401:
            results.add_pass("Auth me without token", "Correctly returns 401")
        else:
            results.add_fail("Auth me without token", f"Expected 401, got {response.status_code}")
        
        return True
    except Exception as e:
        results.add_fail("Auth", f"Exception: {str(e)}")
        return False

def test_coupons():
    """Test 6: Coupon validation"""
    print("\n" + "="*80)
    print("TEST 6: Coupons")
    print("="*80)
    try:
        # 6a: LUMEN10 (10% off, no minimum)
        response = requests.post(f"{BASE_URL}/coupons/validate", 
                                json={"code": "LUMEN10", "subtotal": 5000}, timeout=10)
        data = response.json()
        if response.status_code == 200 and data.get('discount') == 500 and data.get('type') == 'pct':
            results.add_pass("Coupon LUMEN10", f"Discount: ₹{data.get('discount')}")
        else:
            results.add_fail("Coupon LUMEN10", f"Expected discount=500, got: {data}")
        
        # 6b: WELCOME20 (20% off, min 2000)
        response = requests.post(f"{BASE_URL}/coupons/validate", 
                                json={"code": "WELCOME20", "subtotal": 5000}, timeout=10)
        data = response.json()
        if response.status_code == 200 and data.get('discount') == 1000:
            results.add_pass("Coupon WELCOME20", f"Discount: ₹{data.get('discount')}")
        else:
            results.add_fail("Coupon WELCOME20", f"Expected discount=1000, got: {data}")
        
        # 6c: WELCOME20 below minimum
        response = requests.post(f"{BASE_URL}/coupons/validate", 
                                json={"code": "WELCOME20", "subtotal": 1000}, timeout=10)
        if response.status_code == 400:
            results.add_pass("Coupon min check", "Correctly rejects below minimum")
        else:
            results.add_fail("Coupon min check", f"Expected 400, got {response.status_code}")
        
        # 6d: FLAT500 (flat 500 off, min 3000)
        response = requests.post(f"{BASE_URL}/coupons/validate", 
                                json={"code": "FLAT500", "subtotal": 4000}, timeout=10)
        data = response.json()
        if response.status_code == 200 and data.get('discount') == 500:
            results.add_pass("Coupon FLAT500", f"Discount: ₹{data.get('discount')}")
        else:
            results.add_fail("Coupon FLAT500", f"Expected discount=500, got: {data}")
        
        # 6e: Invalid coupon
        response = requests.post(f"{BASE_URL}/coupons/validate", 
                                json={"code": "INVALID", "subtotal": 5000}, timeout=10)
        if response.status_code == 400:
            results.add_pass("Invalid coupon", "Correctly rejects invalid coupon")
        else:
            results.add_fail("Invalid coupon", f"Expected 400, got {response.status_code}")
        
        return True
    except Exception as e:
        results.add_fail("Coupons", f"Exception: {str(e)}")
        return False

def test_orders():
    """Test 7: Order flow (create, verify, list)"""
    print("\n" + "="*80)
    print("TEST 7: Orders")
    print("="*80)
    global test_order_id, test_product_id
    
    if not test_product_id:
        results.add_fail("Orders", "No product ID available for testing")
        return False
    
    try:
        # 7a: Create order
        order_data = {
            "items": [{"productId": test_product_id, "qty": 1}],
            "shippingAddress": {
                "fullName": "Test User",
                "email": customer_email or "test@test.com",
                "phone": "9876543210",
                "line1": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "country": "India"
            },
            "couponCode": "LUMEN10"
        }
        
        response = requests.post(f"{BASE_URL}/orders", json=order_data, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Create order", f"Status {response.status_code}: {data}")
            return False
        
        if 'order' not in data:
            results.add_fail("Create order", f"Missing order in response: {data.keys()}")
            return False
        
        order = data['order']
        test_order_id = order.get('id')
        
        # Check test mode
        if data.get('testMode') != True:
            results.add_warning("Create order", "testMode should be true with placeholder keys")
        
        # Check calculations
        subtotal = order.get('subtotal', 0)
        discount = order.get('discount', 0)
        shipping = order.get('shipping', 0)
        tax = order.get('tax', 0)
        total = order.get('total', 0)
        
        # Verify shipping logic (free if subtotal > 1500)
        expected_shipping = 0 if subtotal > 1500 else 99
        if shipping != expected_shipping:
            results.add_fail("Order shipping", f"Expected {expected_shipping}, got {shipping}")
        else:
            results.add_pass("Order shipping", f"Correct: ₹{shipping}")
        
        # Verify total calculation
        expected_total = subtotal - discount + shipping + tax
        if abs(total - expected_total) > 1:  # Allow 1 rupee rounding difference
            results.add_fail("Order total", f"Expected {expected_total}, got {total}")
        else:
            results.add_pass("Create order", f"Order created: {test_order_id}, Total: ₹{total}")
        
        # 7b: Get product stock before verify
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        products_data = response.json()
        product_before = next((p for p in products_data.get('items', []) if p['id'] == test_product_id), None)
        stock_before = product_before.get('stock', 0) if product_before else 0
        
        # 7c: Verify order (simulate payment)
        verify_data = {"orderId": test_order_id, "simulate": True}
        response = requests.post(f"{BASE_URL}/orders/verify", json=verify_data, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Verify order", f"Status {response.status_code}: {data}")
            return False
        
        verified_order = data.get('order', {})
        if verified_order.get('status') != 'confirmed' or verified_order.get('paymentStatus') != 'paid':
            results.add_fail("Verify order", f"Status not updated correctly: {verified_order.get('status')}, {verified_order.get('paymentStatus')}")
        else:
            results.add_pass("Verify order", f"Order confirmed and paid")
        
        if not verified_order.get('razorpayPaymentId'):
            results.add_fail("Verify order", "Missing razorpayPaymentId")
        else:
            results.add_pass("Verify order payment ID", f"Set: {verified_order.get('razorpayPaymentId')}")
        
        # 7d: Check stock was decremented
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        products_data = response.json()
        product_after = next((p for p in products_data.get('items', []) if p['id'] == test_product_id), None)
        stock_after = product_after.get('stock', 0) if product_after else 0
        
        if stock_after == stock_before - 1:
            results.add_pass("Stock decrement", f"Stock reduced from {stock_before} to {stock_after}")
        else:
            results.add_fail("Stock decrement", f"Expected {stock_before - 1}, got {stock_after}")
        
        # 7e: Get user orders (authenticated)
        if customer_token:
            headers = {"Authorization": f"Bearer {customer_token}"}
            response = requests.get(f"{BASE_URL}/orders", headers=headers, timeout=10)
            data = response.json()
            
            if response.status_code == 200 and isinstance(data, list):
                user_order = next((o for o in data if o.get('id') == test_order_id), None)
                if user_order:
                    results.add_pass("Get user orders", f"Found {len(data)} orders including test order")
                else:
                    results.add_fail("Get user orders", "Test order not found in user's orders")
            else:
                results.add_fail("Get user orders", f"Status {response.status_code}: {data}")
        
        # 7f: Get specific order
        response = requests.get(f"{BASE_URL}/orders/{test_order_id}", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('id') == test_order_id:
            results.add_pass("Get order by ID", f"Retrieved order {test_order_id}")
        else:
            results.add_fail("Get order by ID", f"Status {response.status_code}: {data}")
        
        return True
    except Exception as e:
        results.add_fail("Orders", f"Exception: {str(e)}")
        return False

def test_reviews():
    """Test 8: Reviews (create and verify product rating update)"""
    print("\n" + "="*80)
    print("TEST 8: Reviews")
    print("="*80)
    global test_product_id, customer_token
    
    if not test_product_id or not customer_token:
        results.add_fail("Reviews", "Missing product ID or customer token")
        return False
    
    try:
        # Get product rating before review
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        products_data = response.json()
        product_before = next((p for p in products_data.get('items', []) if p['id'] == test_product_id), None)
        rating_before = product_before.get('rating', 0) if product_before else 0
        num_reviews_before = product_before.get('numReviews', 0) if product_before else 0
        
        # Create review
        review_data = {
            "productId": test_product_id,
            "rating": 5,
            "comment": "Great product! Highly recommended."
        }
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.post(f"{BASE_URL}/reviews", json=review_data, headers=headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Create review", f"Status {response.status_code}: {data}")
            return False
        
        results.add_pass("Create review", f"Review created with rating 5")
        
        # Get product rating after review
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        products_data = response.json()
        product_after = next((p for p in products_data.get('items', []) if p['id'] == test_product_id), None)
        rating_after = product_after.get('rating', 0) if product_after else 0
        num_reviews_after = product_after.get('numReviews', 0) if product_after else 0
        
        if num_reviews_after == num_reviews_before + 1:
            results.add_pass("Review count update", f"numReviews increased from {num_reviews_before} to {num_reviews_after}")
        else:
            results.add_fail("Review count update", f"Expected {num_reviews_before + 1}, got {num_reviews_after}")
        
        # Rating should be updated (exact value depends on existing reviews)
        if rating_after > 0:
            results.add_pass("Rating update", f"Product rating updated to {rating_after}")
        else:
            results.add_fail("Rating update", "Product rating not updated")
        
        return True
    except Exception as e:
        results.add_fail("Reviews", f"Exception: {str(e)}")
        return False

def test_admin():
    """Test 9: Admin endpoints"""
    print("\n" + "="*80)
    print("TEST 9: Admin Endpoints")
    print("="*80)
    global admin_token, customer_token, test_order_id, created_product_id
    
    if not admin_token:
        results.add_fail("Admin", "No admin token available")
        return False
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    customer_headers = {"Authorization": f"Bearer {customer_token}"} if customer_token else {}
    
    try:
        # 9a: Admin stats
        response = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            results.add_fail("Admin stats", f"Status {response.status_code}: {data}")
        else:
            required_fields = ['revenue', 'orders', 'paidOrders', 'products', 'users', 'chart']
            missing = [f for f in required_fields if f not in data]
            if missing:
                results.add_fail("Admin stats", f"Missing fields: {missing}")
            else:
                results.add_pass("Admin stats", f"Revenue: ₹{data['revenue']}, Orders: {data['orders']}, Products: {data['products']}")
        
        # 9b: Admin orders list
        response = requests.get(f"{BASE_URL}/admin/orders", headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and isinstance(data, list):
            results.add_pass("Admin orders list", f"Got {len(data)} orders")
        else:
            results.add_fail("Admin orders list", f"Status {response.status_code}: {data}")
        
        # 9c: Update order status
        if test_order_id:
            update_data = {"status": "shipped"}
            response = requests.put(f"{BASE_URL}/admin/orders/{test_order_id}", 
                                   json=update_data, headers=admin_headers, timeout=10)
            data = response.json()
            
            if response.status_code == 200 and data.get('status') == 'shipped':
                results.add_pass("Update order status", f"Order status updated to shipped")
            else:
                results.add_fail("Update order status", f"Status {response.status_code}: {data}")
        
        # 9d: Admin users list
        response = requests.get(f"{BASE_URL}/admin/users", headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and isinstance(data, list):
            results.add_pass("Admin users list", f"Got {len(data)} users")
        else:
            results.add_fail("Admin users list", f"Status {response.status_code}: {data}")
        
        # 9e: Create product (admin)
        import time
        new_product = {
            "name": f"Test Product {int(time.time())}",
            "slug": f"test-product-{int(time.time())}",
            "brand": "Test Brand",
            "category": "men",
            "price": 1999,
            "description": "Test product description",
            "images": ["https://via.placeholder.com/400"],
            "stock": 100,
            "featured": False,
            "bestSeller": False,
            "newArrival": False
        }
        response = requests.post(f"{BASE_URL}/products", json=new_product, headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and 'id' in data:
            created_product_id = data['id']
            results.add_pass("Create product", f"Created product: {created_product_id}")
        else:
            results.add_fail("Create product", f"Status {response.status_code}: {data}")
        
        # 9f: Update product (admin)
        if created_product_id:
            update_data = {"price": 999}
            response = requests.put(f"{BASE_URL}/admin/products/{created_product_id}", 
                                   json=update_data, headers=admin_headers, timeout=10)
            data = response.json()
            
            if response.status_code == 200 and data.get('price') == 999:
                results.add_pass("Update product", f"Product price updated to ₹999")
            else:
                results.add_fail("Update product", f"Status {response.status_code}: {data}")
        
        # 9g: Delete product (admin)
        if created_product_id:
            response = requests.delete(f"{BASE_URL}/admin/products/{created_product_id}", 
                                      headers=admin_headers, timeout=10)
            data = response.json()
            
            if response.status_code == 200 and data.get('deleted') == True:
                results.add_pass("Delete product", f"Product deleted successfully")
            else:
                results.add_fail("Delete product", f"Status {response.status_code}: {data}")
        
        # 9h: Test admin-only access (non-admin should get 403)
        if customer_token:
            response = requests.get(f"{BASE_URL}/admin/stats", headers=customer_headers, timeout=10)
            if response.status_code == 403:
                results.add_pass("Admin access control", "Non-admin correctly denied access")
            else:
                results.add_fail("Admin access control", f"Expected 403, got {response.status_code}")
        
        return True
    except Exception as e:
        results.add_fail("Admin", f"Exception: {str(e)}")
        return False

def test_cors():
    """Test 10: CORS headers"""
    print("\n" + "="*80)
    print("TEST 10: CORS")
    print("="*80)
    try:
        response = requests.options(f"{BASE_URL}/", timeout=10)
        
        if response.status_code == 200:
            headers = response.headers
            has_cors = 'Access-Control-Allow-Origin' in headers
            if has_cors:
                results.add_pass("CORS", f"CORS headers present: {headers.get('Access-Control-Allow-Origin')}")
            else:
                results.add_fail("CORS", "Missing CORS headers")
        else:
            results.add_fail("CORS", f"OPTIONS request failed: {response.status_code}")
        
        return True
    except Exception as e:
        results.add_fail("CORS", f"Exception: {str(e)}")
        return False

def main():
    print("="*80)
    print("LUMEN COMMERCE BACKEND API TESTS")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    # Run all tests in order
    test_health()
    test_categories()
    test_products()
    test_product_detail()
    test_auth()
    test_coupons()
    test_orders()
    test_reviews()
    test_admin()
    test_cors()
    
    # Print summary
    success = results.summary()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
