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
  pricePerDay: number; // Changed from string to number for calculations
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
          const totalPrice = calculateTotalPrice(bike.pricePerDay, days, 10); // Assume 10% discount for calculation
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
    const totalPrice = calculateTotalPrice(selectedBike.pricePerDay, days, 10); // 10% discount for 3+ days
    
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

  // Get localized tips with more content
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
