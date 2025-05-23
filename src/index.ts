import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Agent persona configuration
const AGENT_PERSONA = {
  name: "Nam Nguyen",
  username: "@nam_rentalhelper",
  personality: "friendly, helpful, local Vietnamese guy",
  cities: ["Da Nang", "Ho Chi Minh City", "Hanoi"] as const,
  languages: {
    customer: "English",
    vendor: "Vietnamese"
  }
} as const;

// Custom error class for better error handling
class RentalError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'RentalError';
  }
}

// Fixed interface definitions with proper types
interface BikeModel {
  model: string;
  pricePerDay: number;
  photo?: string;
  available: boolean;
  engine?: string;
  transmission?: 'automatic' | 'manual';
  fuelType?: 'petrol' | 'electric';
}

interface RentalOption {
  city: string;
  shop: string;
  contact: string;
  bikes: BikeModel[];
  discount?: string;
  delivery: string;
  requirements: string[];
  rating?: number;
  address?: string;
  workingHours?: string;
}

interface BookingRequest {
  shopName: string;
  bikeModel: string;
  startDate: string;
  endDate: string;
  customerName: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  email?: string;
}

interface NegotiationResult {
  success: boolean;
  finalPrice: number;
  originalPrice: number;
  message: string;
}

// Message templates in Vietnamese for vendors
const VENDOR_TEMPLATES = {
  initial_inquiry: `Chào anh/chị, bạn mình là người nước ngoài muốn thuê xe máy vài ngày ở {city}. Anh/chị có xe nào cho thuê không? Giá bao nhiêu một ngày? Có giảm giá nếu thuê 3 ngày trở lên không? Gửi giúp mình vài ảnh xe với nhé. Cảm ơn nhiều!`,
  
  follow_up: `Anh/chị ơi, bạn mình cần thuê từ ngày {startDate} đến {endDate}. Có xe nào available không? Budget khoảng {budget} một ngày. Delivery có được không?`,
  
  negotiation: `Anh/chị có thể giảm giá một chút không? Bạn mình thuê lâu dài {days} ngày. Giá {currentPrice} có thể xuống {targetPrice} được không?`,
  
  booking_confirm: `OK anh/chị, bạn mình đồng ý thuê xe {model} với giá {price}/ngày từ {startDate} đến {endDate}. Cần giấy tờ gì và đặt cọc bao nhiêu?`
} as const;

// Customer message templates in English
const CUSTOMER_TEMPLATES = {
  greeting: `Hey! My name is Nam. I'm helping you find a good rental in {city}. I'll check with some rental places and get back to you shortly with options! 😊`,
  
  asking_details: `Hi bro! I need a few details to find you the best deal:
- Which city? (Da Nang, Ho Chi Minh, or Hanoi)
- What dates do you need the bike?
- What's your daily budget? (in VND)
- Any specific type? (scooter, motorbike, automatic/manual)`,
  
  presenting_options: `Found some good options for you in {city}! 🏍️

Here's what I got:`,
  
  recommendation: `My recommendation: Go with {shopName} - they're reliable and give good prices to foreigners. Want me to book it for you?`
} as const;

// Fixed rental database with proper number types
const RENTAL_DATABASE: RentalOption[] = [
  {
    city: "Da Nang",
    shop: "Thanh Xe Tốt",
    contact: "+84901234567",
    bikes: [
      { 
        model: "Honda Vision", 
        pricePerDay: 150000,
        available: true,
        engine: "125cc",
        transmission: "automatic",
        fuelType: "petrol"
      },
      { 
        model: "Yamaha Nouvo", 
        pricePerDay: 180000,
        available: true,
        engine: "135cc",
        transmission: "automatic",
        fuelType: "petrol"
      },
      { 
        model: "Honda SH", 
        pricePerDay: 250000,
        available: false,
        engine: "150cc",
        transmission: "automatic",
        fuelType: "petrol"
      }
    ],
    discount: "10% off for 3+ days",
    delivery: "Yes, within city center",
    requirements: ["Passport copy", "50,000₫ deposit"],
    rating: 4.5,
    address: "123 Le Duan St, Hai Chau, Da Nang",
    workingHours: "8:00 AM - 8:00 PM"
  },
  {
    city: "Ho Chi Minh City",
    shop: "Saigon Motorbike Rental",
    contact: "+84907654321",
    bikes: [
      { 
        model: "Honda Wave", 
        pricePerDay: 120000,
        available: true,
        engine: "110cc",
        transmission: "manual",
        fuelType: "petrol"
      },
      { 
        model: "Yamaha Exciter", 
        pricePerDay: 200000,
        available: true,
        engine: "155cc",
        transmission: "manual",
        fuelType: "petrol"
      },
      { 
        model: "Honda CBR", 
        pricePerDay: 300000,
        available: true,
        engine: "250cc",
        transmission: "manual",
        fuelType: "petrol"
      }
    ],
    discount: "15% off for 5+ days",
    delivery: "Yes, to hotel/airport",
    requirements: ["International license", "Passport", "100,000₫ deposit"],
    rating: 4.8,
    address: "456 Nguyen Hue St, District 1, Ho Chi Minh City",
    workingHours: "7:00 AM - 9:00 PM"
  },
  {
    city: "Hanoi",
    shop: "Hanoi Easy Riders",
    contact: "+84912345678",
    bikes: [
      { 
        model: "Honda Future", 
        pricePerDay: 140000,
        available: true,
        engine: "125cc",
        transmission: "manual",
        fuelType: "petrol"
      },
      { 
        model: "Suzuki Raider", 
        pricePerDay: 160000,
        available: true,
        engine: "150cc",
        transmission: "manual",
        fuelType: "petrol"
      },
      { 
        model: "Kawasaki Ninja", 
        pricePerDay: 350000,
        available: false,
        engine: "300cc",
        transmission: "manual",
        fuelType: "petrol"
      }
    ],
    discount: "20% off for weekly rental",
    delivery: "District 1 and Ba Dinh only",
    requirements: ["Passport copy", "Visa", "200,000₫ deposit"],
    rating: 4.3,
    address: "789 Hoan Kiem St, Old Quarter, Hanoi",
    workingHours: "8:00 AM - 7:00 PM"
  }
];

// Utility functions
const validateDateRange = (startDate: string, endDate: string): void => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new RentalError('Invalid date format. Use YYYY-MM-DD', 'INVALID_DATE_FORMAT');
  }
  
  if (start < now) {
    throw new RentalError('Start date cannot be in the past', 'PAST_DATE');
  }
  
  if (end <= start) {
    throw new RentalError('End date must be after start date', 'INVALID_DATE_RANGE');
  }
  
  const maxDays = 30;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > maxDays) {
    throw new RentalError(`Rental period cannot exceed ${maxDays} days`, 'RENTAL_TOO_LONG');
  }
};

const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateTotalPrice = (dailyPrice: number, days: number, discountPercent?: number): number => {
  const baseTotal = dailyPrice * days;
  if (discountPercent && days >= 3) {
    return Math.round(baseTotal * (1 - discountPercent / 100));
  }
  return baseTotal;
};

const formatPrice = (price: number): string => {
  return `${price.toLocaleString('vi-VN')}₫`;
};

class VietnamRentalAssistant {
  
  // Simulate contacting vendors with better error handling
  async contactVendors(city: string, requirements: any): Promise<RentalOption[]> {
    // Validate city
    if (!city || !AGENT_PERSONA.cities.includes(city as any)) {
      throw new RentalError(
        `Invalid city. Must be one of: ${AGENT_PERSONA.cities.join(', ')}`, 
        'INVALID_CITY'
      );
    }

    console.log(`[Nam]: Contacting rental shops in ${city}...`);
    
    // Simulate delay for realistic messaging
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const cityRentals = RENTAL_DATABASE.filter(
      rental => rental.city.toLowerCase() === city.toLowerCase()
    );
    
    // Filter by budget if provided
    if (requirements.budget) {
      const budgetNum = parseInt(requirements.budget.toString().replace(/[^\d]/g, ''));
      cityRentals.forEach(rental => {
        rental.bikes = rental.bikes.filter(bike => bike.pricePerDay <= budgetNum);
      });
    }

    // Filter by bike type if provided
    if (requirements.bikeType && requirements.bikeType !== 'any') {
      cityRentals.forEach(rental => {
        rental.bikes = rental.bikes.filter(bike => {
          switch (requirements.bikeType) {
            case 'scooter':
              return bike.transmission === 'automatic';
            case 'motorbike':
              return bike.transmission === 'manual';
            case 'automatic':
              return bike.transmission === 'automatic';
            case 'manual':
              return bike.transmission === 'manual';
            default:
              return true;
          }
        });
      });
    }
    
    return cityRentals.filter(rental => rental.bikes.length > 0);
  }

  // Format rental options for customer with improved formatting
  formatOptionsForCustomer(options: RentalOption[], days?: number): string {
    let response = "";
    
    options.forEach((option, index) => {
      response += `\n🏪 **${option.shop}** (Rating: ${option.rating}/5)\n`;
      response += `📍 ${option.address}\n`;
      response += `📞 Contact: ${option.contact}\n`;
      response += `🕒 Hours: ${option.workingHours}\n`;
      response += `🚚 Delivery: ${option.delivery}\n`;
      response += `💰 Discount: ${option.discount}\n`;
      response += `📋 Requirements: ${option.requirements.join(', ')}\n`;
      response += `\n🏍️ Available bikes:\n`;
      
      option.bikes.forEach(bike => {
        const status = bike.available ? "✅" : "❌";
        const dailyPrice = formatPrice(bike.pricePerDay);
        let totalPriceStr = "";
        
        if (days && bike.available) {
          const totalPrice = calculateTotalPrice(bike.pricePerDay, days, 10);
          totalPriceStr = ` (${days} days: ${formatPrice(totalPrice)})`;
        }
        
        response += `   ${status} ${bike.model} - ${dailyPrice}/day${totalPriceStr}\n`;
        response += `      ${bike.engine} • ${bike.transmission} • ${bike.fuelType}\n`;
      });
      response += `\n`;
    });
    
    return response;
  }

  // Generate negotiation strategy with better logic
  generateNegotiationTips(options: RentalOption[]): string {
    return `\n💡 **Nam's Local Tips:**
- Ask for weekly rates (usually 20-30% cheaper)
- Mention you're staying long-term for better deals  
- Book directly through me - I can get foreigner-friendly prices
- Avoid tourist areas for pickup (I'll handle delivery)
- Best time to negotiate: weekdays, off-season
- Always check the bike condition before accepting`;
  }

  // Improved negotiation with realistic outcomes
  async negotiatePrice(shopName: string, currentPrice: string, targetPrice: string, days: number): Promise<NegotiationResult> {
    const currentPriceNum = parseInt(currentPrice.replace(/[^\d]/g, ''));
    const targetPriceNum = parseInt(targetPrice.replace(/[^\d]/g, ''));
    
    // Validate inputs
    if (currentPriceNum <= targetPriceNum) {
      throw new RentalError('Target price must be lower than current price', 'INVALID_NEGOTIATION');
    }

    // Simulate negotiation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Negotiation success factors
    const discountRequested = (currentPriceNum - targetPriceNum) / currentPriceNum;
    const longTermBonus = days >= 7 ? 0.2 : days >= 3 ? 0.1 : 0;
    const baseSuccessRate = 0.7;
    
    // More realistic negotiation logic
    const successRate = Math.min(0.9, baseSuccessRate + longTermBonus - (discountRequested * 2));
    const negotiationSuccess = Math.random() < successRate;
    
    if (negotiationSuccess) {
      return {
        success: true,
        finalPrice: targetPriceNum,
        originalPrice: currentPriceNum,
        message: `Great news! 🎉 I managed to negotiate with ${shopName}. They agreed to ${formatPrice(targetPriceNum)}/day for ${days} days. They like dealing with me because I bring them regular customers.`
      };
    } else {
      // Partial success - meet somewhere in the middle
      const compromisePrice = Math.floor(currentPriceNum - (currentPriceNum - targetPriceNum) * 0.6);
      return {
        success: false,
        finalPrice: compromisePrice,
        originalPrice: currentPriceNum,
        message: `I tried my best with ${shopName}! They can't go as low as ${formatPrice(targetPriceNum)}, but they offered ${formatPrice(compromisePrice)}/day instead. Still a good deal considering it includes delivery.`
      };
    }
  }

  // Create booking summary with proper validation
  createBookingSummary(rental: RentalOption, bikeModel: string, startDate: string, endDate: string): any {
    const selectedBike = rental.bikes.find(bike => bike.model === bikeModel);
    if (!selectedBike) {
      throw new RentalError(`Bike model ${bikeModel} not found at ${rental.shop}`, 'BIKE_NOT_FOUND');
    }

    if (!selectedBike.available) {
      throw new RentalError(`${bikeModel} is not available at ${rental.shop}`, 'BIKE_UNAVAILABLE');
    }

    const days = calculateDays(startDate, endDate);
    const totalPrice = calculateTotalPrice(selectedBike.pricePerDay, days, 10);
    
    return {
      shop: rental.shop,
      contact: rental.contact,
      address: rental.address,
      bike: selectedBike,
      duration: `${days} days`,
      dailyPrice: formatPrice(selectedBike.pricePerDay),
      totalPrice: formatPrice(totalPrice),
      requirements: rental.requirements,
      delivery: rental.delivery,
      discount: days >= 3 ? rental.discount : 'No discount (less than 3 days)',
      startDate,
      endDate,
      agentNote: "I'll coordinate pickup/delivery and handle all communication with the shop for you!"
    };
  }

  // Get localized tips with complete content
  getLocalTips(city: string, topic?: string): string {
    const tips: Record<string, Record<string, string>> = {
      'Da Nang': {
        traffic: "Traffic is chill compared to Saigon. Watch out for the Dragon Bridge area during weekends - gets crowded with tourists. Peak hours: 7-9 AM, 5-7 PM.",
        parking: "Park at hotels or cafes, tip the security guard 5-10k VND. Avoid leaving helmet on bike near beach areas. Most shopping centers have free motorbike parking.",
        fuel: "Petrol stations everywhere. About 25k VND per liter. Keep tank above half - some stations close early. Look for Petrolimex or Shell stations.",
        police: "Police rarely stop foreigners in Da Nang. If stopped, be polite, show passport and license. They usually just check and let you go. No bribes needed.",
        routes: "Coastal road is beautiful but windy. Hai Van Pass is epic but challenging - start early morning. Ba Na Hills road can be steep and foggy.",
        safety: "Wear helmet always! Rain comes suddenly, so bring poncho. Watch for sand on coastal roads. Avoid riding during typhoon season (Oct-Dec)."
      },
      'Ho Chi Minh City': {
        traffic: "Crazy traffic! Follow the flow, don't stop suddenly. Peak hours are nightmare: 7-9 AM, 5-8 PM. Use Grab bike lanes when possible.",
        parking: "Pay parking everywhere (3-5k VND). Don't park illegally - they'll clamp your wheel. District 1 has expensive parking, try side streets.",
        fuel: "24/7 petrol stations available. Slightly more expensive than other cities. Watch for fake petrol - stick to major brands.",
        police: "Police checkpoints common, especially at night. Always carry license and passport. Traffic fines can be negotiated but don't offer bribes first.",
        routes: "Avoid Nguyen Hue and Dong Khoi during rush hour. Use smaller alleys but watch for one-way streets. Ring roads are faster for long distances.",
        safety: "Super busy traffic - stay alert! Pickpockets at red lights. Don't wear jewelry or flash phone. Rain makes roads very slippery."
      },
      'Hanoi': {
        traffic: "Old Quarter is crazy narrow streets. Lots of one-ways and dead ends. Traffic is aggressive but slower speeds than HCMC.",
        parking: "Street parking everywhere but watch for 'no parking' signs. Old Quarter gets expensive. Many coffee shops offer free parking.",
        fuel: "Regular stations but some close early. Winter can affect bike performance - keep tank full. Cheaper than southern cities.",
        police: "Stricter than south about helmets and licenses. Random checks common near tourist areas. Fines are fixed prices, don't negotiate.",
        routes: "Ring roads bypass city center. Long Bien Bridge is scenic but windy. Avoid Old Quarter during festivals and weekends.",
        safety: "Cold weather needs warm clothes. Rain is frequent - get good rain gear. Fog in winter reduces visibility significantly."
      }
    };

    const cityTips = tips[city];
    if (!cityTips) {
      return `I don't have specific tips for ${city} yet. Stick to the main cities: Da Nang, Ho Chi Minh City, or Hanoi for the best local advice!`;
    }

    if (topic && cityTips[topic]) {
      return `💡 **${topic.charAt(0).toUpperCase() + topic.slice(1)} tips for ${city}:**\n\n${cityTips[topic]}`;
    }

    // Return all tips if no specific topic
    let allTips = `💡 **Local tips for ${city}:**\n\n`;
    Object.entries(cityTips).forEach(([key, value]) => {
      allTips += `**${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}\n\n`;
    });
    
    return allTips;
  }
}

// Initialize the MCP server
const server = new Server(
  {
    name: 'vietnam-rental-assistant',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Create assistant instance
const assistant = new VietnamRentalAssistant();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_rentals',
        description: 'Search for motorbike/scooter rentals in Vietnamese cities (Da Nang, Ho Chi Minh City, Hanoi)',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City to search in',
              enum: ['Da Nang', 'Ho Chi Minh City', 'Hanoi']
            },
            startDate: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD format)',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            endDate: {
              type: 'string',
              description: 'End date (YYYY-MM-DD format)',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            budget: {
              type: 'string',
              description: 'Daily budget in Vietnamese Dong (VND)'
            },
            bikeType: {
              type: 'string',
              description: 'Type of bike preferred',
              enum: ['scooter', 'motorbike', 'automatic', 'manual', 'any']
            }
          },
          required: ['city']
        }
      },
      {
        name: 'negotiate_price',
        description: 'Negotiate better prices with rental shops using local connections',
        inputSchema: {
          type: 'object',
          properties: {
            shopName: {
              type: 'string',
              description: 'Name of the rental shop'
            },
            currentPrice: {
              type: 'string',
              description: 'Current daily price in VND'
            },
            targetPrice: {
              type: 'string',
              description: 'Desired daily price in VND'
            },
            days: {
              type: 'number',
              description: 'Number of rental days'
            }
          },
          required: ['shopName', 'currentPrice', 'targetPrice', 'days']
        }
      },
      {
        name: 'book_rental',
        description: 'Complete booking process with vendor coordination',
        inputSchema: {
          type: 'object',
          properties: {
            shopName: {
              type: 'string',
              description: 'Name of the rental shop'
            },
            bikeModel: {
              type: 'string',
              description: 'Model of the bike to book'
            },
            startDate: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            endDate: {
              type: 'string',
              description: 'End date (YYYY-MM-DD)',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            customerName: {
              type: 'string',
              description: 'Customer full name'
            },
            deliveryAddress: {
              type: 'string',
              description: 'Hotel or delivery address (optional)'
            },
            phoneNumber: {
              type: 'string',
              description: 'Customer phone number (optional)'
            }
          },
          required: ['shopName', 'bikeModel', 'startDate', 'endDate', 'customerName']
        }
      },
      {
        name: 'get_local_tips',
        description: 'Get authentic local advice for riding in Vietnam',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City to get tips for',
              enum: ['Da Nang', 'Ho Chi Minh City', 'Hanoi']
            },
            topic: {
              type: 'string',
              description: 'Specific topic for advice',
              enum: ['traffic', 'parking', 'fuel', 'police', 'routes', 'safety']
            }
          },
          required: ['city']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'search_rentals': {
        const { city, startDate, endDate, budget, bikeType } = request.params.arguments as any;
        
        // Validate required parameters
        if (!city) {
          throw new RentalError('City is required', 'MISSING_CITY');
        }

        // Validate dates if provided
        if (startDate && endDate) {
          validateDateRange(startDate, endDate);
        }

        const requirements = { budget, bikeType };
        const options = await assistant.contactVendors(city, requirements);
        
        if (options.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `Hey! I checked with my contacts in ${city} but couldn't find anything matching your requirements. Try adjusting your budget or bike type, or let me know if you're flexible with the dates! 🏍️`
            }]
          };
        }

        const days = startDate && endDate ? calculateDays(startDate, endDate) : undefined;
        const formattedOptions = assistant.formatOptionsForCustomer(options, days);
        const tips = assistant.generateNegotiationTips(options);
        
        const response = `Hey bro! 👋 Found some solid options in ${city}! Let me break it down for you:

${formattedOptions}

${tips}

Which one catches your eye? I can negotiate better prices or book it straight away for you! 😊`;

        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }

      case 'negotiate_price': {
        const { shopName, currentPrice, targetPrice, days } = request.params.arguments as any;
        
        if (!shopName || !currentPrice || !targetPrice || !days) {
          throw new RentalError('All negotiation parameters are required', 'MISSING_NEGOTIATION_PARAMS');
        }

        const result = await assistant.negotiatePrice(shopName, currentPrice, targetPrice, days);
        
        const response = `🎯 **Negotiation Update**

${result.message}

💰 **Price Summary:**
- Original: ${formatPrice(result.originalPrice)}/day
- Final: ${formatPrice(result.finalPrice)}/day
- Total for ${days} days: ${formatPrice(result.finalPrice * days)}

${result.success ? "🎉 Deal secured!" : "💪 Still a good compromise!"} Want me to book this for you?`;

        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }

      case 'book_rental': {
        const { shopName, bikeModel, startDate, endDate, customerName, deliveryAddress } = request.params.arguments as any;
        
        if (!shopName || !bikeModel || !startDate || !endDate || !customerName) {
          throw new RentalError('Missing required booking information', 'MISSING_BOOKING_PARAMS');
        }

        validateDateRange(startDate, endDate);

        // Find the rental shop
        const rental = RENTAL_DATABASE.find(r => r.shop === shopName);
        if (!rental) {
          throw new RentalError(`Shop ${shopName} not found`, 'SHOP_NOT_FOUND');
        }

        const bookingSummary = assistant.createBookingSummary(rental, bikeModel, startDate, endDate);
        
        // Simulate booking confirmation delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const bookingId = `VR${Date.now().toString(36).toUpperCase()}`;
        
        const response = `🎉 **Booking Confirmed!** 

**Booking ID:** ${bookingId}
**Customer:** ${customerName}
**Shop:** ${bookingSummary.shop}
**Bike:** ${bookingSummary.bike.model} (${bookingSummary.bike.engine})
**Duration:** ${bookingSummary.duration} (${bookingSummary.startDate} to ${bookingSummary.endDate})
**Price:** ${bookingSummary.dailyPrice} × ${bookingSummary.duration} = ${bookingSummary.totalPrice}
**Discount:** ${bookingSummary.discount}

📍 **Pickup/Delivery:**
${deliveryAddress ? `Delivery to: ${deliveryAddress}` : `Pickup at: ${bookingSummary.address}`}

📋 **Requirements:** ${bookingSummary.requirements.join(', ')}

📞 **Shop Contact:** ${bookingSummary.contact}

✅ **Next Steps:**
1. I've confirmed your booking with the shop
2. They'll contact you 1 day before to confirm delivery/pickup
3. Bring your passport and deposit
4. Check the bike condition before accepting

${bookingSummary.ag
