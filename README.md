# Vietnam-rental-assistant
# Vietnam Rental Assistant MCP Server 🏍️

A Model Context Protocol (MCP) server that acts as **Nam Nguyen**, a friendly local Vietnamese guy helping foreigners find the best motorbike and scooter rentals across Vietnam. This assistant handles vendor communication, price negotiation, and booking coordination just like a real local friend would.

## 🎯 Features

- **Local Persona**: Acts as Nam Nguyen, a helpful Vietnamese local with authentic personality
- **Multi-City Coverage**: Da Nang, Ho Chi Minh City, and Hanoi
- **Vendor Communication**: Simulates real messaging with rental shops in Vietnamese
- **Price Negotiation**: Leverages local connections for better deals
- **Complete Booking Flow**: From search to final booking confirmation
- **Local Tips & Advice**: Traffic, parking, safety tips specific to each city

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd vietnam-rental-assistant

# Install dependencies
npm install

# Build the project
npm run build

# Run in development
npm run dev
```

## 🚀 Usage

### Setup with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "vietnam-rental": {
      "command": "node",
      "args": ["path/to/vietnam-rental-assistant/dist/index.js"]
    }
  }
}
```

### Available Tools

#### 1. `search_rentals`
Search for available rentals in Vietnamese cities.

```typescript
{
  city: "Da Nang",           // Required: Da Nang, Ho Chi Minh City, or Hanoi
  startDate: "2024-06-01",   // Optional: YYYY-MM-DD format
  endDate: "2024-06-05",     // Optional: YYYY-MM-DD format
  budget: "150000",          // Optional: Daily budget in VND
  bikeType: "scooter"        // Optional: scooter, motorbike, automatic, manual, any
}
```

#### 2. `negotiate_price`
Negotiate better prices with rental shops using local connections.

```typescript
{
  shopName: "Thanh Xe Tốt",
  currentPrice: "180000",
  targetPrice: "150000",
  days: 5
}
```

#### 3. `book_rental`
Complete booking process with vendor coordination.

```typescript
{
  shopName: "Thanh Xe Tốt",
  bikeModel: "Honda Vision",
  startDate: "2024-06-01",
  endDate: "2024-06-05",
  customerName: "John Smith",
  deliveryAddress: "Fusion Suites Da Nang Beach"  // Optional
}
```

#### 4. `get_local_tips`
Get authentic local advice for riding in Vietnam.

```typescript
{
  city: "Da Nang",
  topic: "traffic"  // Optional: traffic, parking, fuel, police, routes, safety
}
```

## 🎭 Agent Persona

**Nam Nguyen** (`@nam_rentalhelper`) is designed to feel like a real Vietnamese friend:

- **Personality**: Casual, helpful, trustworthy, local expertise
- **Communication Style**: Natural, friendly messages with local slang
- **Languages**: Vietnamese with vendors, English with customers  
- **Local Knowledge**: Real insights about traffic, best rental spots, pricing

### Sample Interactions

**To Customer:**
> "Hey bro! Found some solid options in Da Nang! 🏍️ Let me show you what my contacts offered..."

**To Vendor (Vietnamese):**
> "Chào anh/chị, bạn mình là người nước ngoài muốn thuê xe máy vài ngày ở Đà Nẵng..."

## 📊 Rental Database

The system includes a comprehensive database of verified rental shops:

- **Da Nang**: Beach-area specialists, tourist-friendly shops
- **Ho Chi Minh City**: High-volume rentals, airport delivery
- **Hanoi**: Old Quarter focused, cultural tour specialists

Each entry includes:
- Shop contact information
- Available bike models and pricing
- Delivery options and coverage areas
- Requirements (documents, deposits)
- Discount policies
- Customer ratings

## 🔧 Technical Architecture

### Core Components

1. **Agent Persona System**: Maintains consistent personality across interactions
2. **Message Templates**: Authentic Vietnamese and English communication patterns
3. **Vendor Simulation**: Realistic response delays and negotiation outcomes
4. **Booking Coordination**: Complete reservation flow with confirmations
5. **Local Knowledge Base**: City-specific tips and cultural insights

### Data Structures

```typescript
interface RentalOption {
  city: string;
  shop: string;
  contact: string;
  bikes: BikeModel[];
  discount?: string;
  delivery: string;
  requirements: string[];
  rating?: number;
}
```

## 🌟 Real-World Integration

For production deployment, integrate with:

- **Messaging APIs**: WhatsApp Business API, Telegram Bot API, Zalo API
- **Browser Automation**: Puppeteer for actual vendor messaging
- **Payment Processing**: VND payment gateways
- **Location Services**: Google Maps for delivery coordination
- **Customer Database**: Booking history and preferences

## 🔒 Privacy & Security

- No storage of customer payment information
- Vendor contacts anonymized in logs
- Secure handling of passport/license data
- GDPR-compliant data practices

## 🌏 Localization

- All customer communication in English
- Vendor communication in authentic Vietnamese
- Currency display in Vietnamese Dong (₫)
- Local cultural context and etiquette

## 📱 Mobile Integration

The MCP server can be integrated with:

- WhatsApp Business for customer interaction
- Telegram bots for automated responses  
- Mobile apps with chat interfaces
- Web dashboards for booking management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add authentic Vietnamese context and language
4. Test with real scenarios
5. Submit pull request

## 📄 License

MIT License - Built with ❤️ for the Vietnam travel community

## 🆘 Support

For support or to add new cities/features:
- Create an issue on GitHub
- Contact: nam@rentalhelper.vn
- Telegram: @nam_rentalhelper

---

*Ride safe, explore Vietnam! 🏍️🇻🇳*
