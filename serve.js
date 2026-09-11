import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const apmcPdfData = [
  { crop: "Groundnut Pods", variety: "Fresh Green Pods", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 166, lowestPrice: 6000, highestPrice: 11000, averagePrice: 8500, currentPrice: 8500, previousPrice: 8200, changePercent: 3.6, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Groundnut pod arrivals at Vashi stood at 166 Qtl with average price ₹8,500/q.", recommendation: "Good demand for graded green groundnut pods for direct wet roasting and retail." },
  { crop: "Lemon", variety: "Kagzi Regular", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 131, lowestPrice: 4000, highestPrice: 6000, averagePrice: 5000, currentPrice: 5000, previousPrice: 5000, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Lemon modal rate at Mumbai APMC is ₹5,000/q (₹50/kg) with 131 Qtl arrivals.", recommendation: "Steady retail demand across Mumbai Metropolitan Region." },
  { crop: "Ginger", variety: "Satara Fresh", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 1121, lowestPrice: 6000, highestPrice: 14000, averagePrice: 10000, currentPrice: 10000, previousPrice: 9500, changePercent: 5.2, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "High arrivals of Satara ginger (1,121 Qtl) averaging ₹10,000/q, peak touching ₹14,000/q.", recommendation: "High grade washed Satara ginger in strong demand from institutional spice extractors." },
  { crop: "Ginger", variety: "Bangalore Medium", mandi: "Mumbai APMC (Vashi)", state: "Karnataka/MH", arrivalVolume: 0, lowestPrice: 6000, highestPrice: 15000, averagePrice: 10500, currentPrice: 10500, previousPrice: 10500, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Bangalore ginger quotation steady at ₹10,500/q reference rate.", recommendation: "Limited fresh supply from southern corridors." },
  { crop: "Colocasia (Arbi)", variety: "Medium Grade", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 216, lowestPrice: 2000, highestPrice: 2600, averagePrice: 2300, currentPrice: 2300, previousPrice: 2200, changePercent: 4.5, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Arbi trading steady at ₹2,300/q with 216 Qtl arrivals.", recommendation: "Maintain sorted grading for hotel supplies." },
  { crop: "Amla (Gooseberry)", variety: "Desi / Hybrid", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 66, lowestPrice: 10000, highestPrice: 12000, averagePrice: 11000, currentPrice: 11000, previousPrice: 10500, changePercent: 4.7, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Amla rates buoyant at ₹11,000/q with light arrival of 66 Qtl.", recommendation: "Ayurvedic processing buyers offering top rates for uniform lots." },
  { crop: "Beetroot", variety: "Dark Red Hybrid", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1600, highestPrice: 2400, averagePrice: 2000, currentPrice: 2000, previousPrice: 2000, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Beetroot benchmark at ₹2,000/q.", recommendation: "Direct salad pack supply channels active." },
  { crop: "Okra (Bhindi)", variety: "Grade 1 Green Tender", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 1132, lowestPrice: 1600, highestPrice: 2000, averagePrice: 1800, currentPrice: 1800, previousPrice: 1750, changePercent: 2.8, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Bhindi No. 1 recorded strong arrival of 1,132 Qtl at average ₹1,800/q.", recommendation: "Prime morning auction lot size suitable for supermarket chains." },
  { crop: "Okra (Bhindi)", variety: "Grade 2 Medium", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1000, highestPrice: 1400, averagePrice: 1200, currentPrice: 1200, previousPrice: 1200, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Grade 2 Bhindi benchmark at ₹1,200/q.", recommendation: "Target local catering buyers." },
  { crop: "Pumpkin (Red)", variety: "Medium-Large", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 780, lowestPrice: 600, highestPrice: 1200, averagePrice: 900, currentPrice: 900, previousPrice: 850, changePercent: 5.8, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Red pumpkin volume healthy at 780 Qtl averaging ₹900/q.", recommendation: "Bulk institutional purchase available." },
  { crop: "Bottle Gourd (Lauki)", variety: "Long Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 184, lowestPrice: 1000, highestPrice: 1600, averagePrice: 1300, currentPrice: 1300, previousPrice: 1300, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Lauki rate stable at ₹1,300/q with 184 Qtl arrivals.", recommendation: "Consistent demand for tender uniform size fruits." },
  { crop: "Cowpea (Chawli)", variety: "Fresh Green Pods", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 106, lowestPrice: 1600, highestPrice: 2200, averagePrice: 1900, currentPrice: 1900, previousPrice: 1850, changePercent: 2.7, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Chawli beans trading at ₹1,900/q.", recommendation: "Prompt morning dispatch recommended." },
  { crop: "Apple Gourd (Tinda)", variety: "Tender Round", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 34, lowestPrice: 2000, highestPrice: 3000, averagePrice: 2500, currentPrice: 2500, previousPrice: 2400, changePercent: 4.1, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Tinda arrivals 34 Qtl with average ₹2,500/q.", recommendation: "Premium rates for unblemished lots." },
  { crop: "French Beans", variety: "Tender Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 160, lowestPrice: 2500, highestPrice: 3500, averagePrice: 3000, currentPrice: 3000, previousPrice: 2900, changePercent: 3.4, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "French beans averaging ₹3,000/q (₹30/kg) with 160 Qtl volume.", recommendation: "Strong weekend wholesale uptake." },
  { crop: "Cauliflower", variety: "Snowball White Curd", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 700, lowestPrice: 1200, highestPrice: 1800, averagePrice: 1500, currentPrice: 1500, previousPrice: 1450, changePercent: 3.4, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Cauliflower 700 Qtl volume at ₹1,500/q average rate.", recommendation: "Demand strong for tight compact heads." },
  { crop: "Carrot", variety: "Orange / Red Hybrid", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 1740, lowestPrice: 1600, highestPrice: 2600, averagePrice: 2100, currentPrice: 2100, previousPrice: 2000, changePercent: 5.0, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Carrots saw heavy arrivals of 1,740 Qtl averaging ₹2,100/q.", recommendation: "Washed and sorted lots clearing at ₹2,600/q ceiling." },
  { crop: "Cluster Beans (Gowar)", variety: "Desi Tender", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 170, lowestPrice: 4000, highestPrice: 7000, averagePrice: 5500, currentPrice: 5500, previousPrice: 5200, changePercent: 5.7, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Gowar trading at premium ₹5,500/q with peak reaching ₹7,000/q.", recommendation: "Top realization for fiber-free pods." },
  { crop: "Flat Beans", variety: "Fresh Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 130, lowestPrice: 3000, highestPrice: 3600, averagePrice: 3300, currentPrice: 3300, previousPrice: 3200, changePercent: 3.1, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Flat beans modal price ₹3,300/q.", recommendation: "Steady retail movement." },
  { crop: "Raw Mango", variety: "Pickle Grade", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 88, lowestPrice: 4000, highestPrice: 4600, averagePrice: 4300, currentPrice: 4300, previousPrice: 4200, changePercent: 2.3, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Raw mango trading at ₹4,300/q with 88 Qtl arrivals.", recommendation: "Pickle manufacturing units buying firm lots." },
  { crop: "Cucumber", variety: "Grade 1 Crisp Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 1070, lowestPrice: 1600, highestPrice: 2200, averagePrice: 1900, currentPrice: 1900, previousPrice: 1800, changePercent: 5.5, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Cucumber No. 1 arrivals 1,070 Qtl with average price ₹1,900/q.", recommendation: "Salad vendors and supermarket chains driving active demand." },
  { crop: "Cucumber", variety: "Grade 2 Medium", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1000, highestPrice: 1400, averagePrice: 1200, currentPrice: 1200, previousPrice: 1200, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Grade 2 Cucumber reference ₹1,200/q.", recommendation: "Suitable for roadside juice and fast food stalls." },
  { crop: "Bitter Gourd (Karela)", variety: "Dark Green Spiny", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 97, lowestPrice: 2200, highestPrice: 3200, averagePrice: 2700, currentPrice: 2700, previousPrice: 2600, changePercent: 3.8, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Karela trading at ₹2,700/q with 97 Qtl volume.", recommendation: "Firm fruits command maximum price." },
  { crop: "Raw Banana", variety: "Cooking Plantain", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 143, lowestPrice: 2600, highestPrice: 3200, averagePrice: 2900, currentPrice: 2900, previousPrice: 2800, changePercent: 3.5, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Raw banana arrivals 143 Qtl at ₹2,900/q.", recommendation: "South Indian bulk catering buyers actively lifting stock." },
  { crop: "Cabbage", variety: "Round Green Compact", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 1261, lowestPrice: 800, highestPrice: 1200, averagePrice: 1000, currentPrice: 1000, previousPrice: 950, changePercent: 5.2, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Cabbage saw high volume of 1,261 Qtl averaging ₹1,000/q (₹10/kg).", recommendation: "High turnover rate for quick farm-gate clearance." },
  { crop: "Ash Gourd (Petha)", variety: "Large White", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1000, highestPrice: 1400, averagePrice: 1200, currentPrice: 1200, previousPrice: 1200, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Ash Gourd reference price ₹1,200/q.", recommendation: "Confectionery and temple procurement channels." },
  { crop: "Capsicum (Bell Pepper)", variety: "Green Blocky Hybrid", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 568, lowestPrice: 2000, highestPrice: 2800, averagePrice: 2400, currentPrice: 2400, previousPrice: 2300, changePercent: 4.3, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Capsicum volume 568 Qtl with modal price ₹2,400/q.", recommendation: "Hotel & restaurant segment driving steady absorption." },
  { crop: "Snake Gourd", variety: "Tender Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 10, lowestPrice: 1600, highestPrice: 2000, averagePrice: 1800, currentPrice: 1800, previousPrice: 1800, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Snake Gourd arrival 10 Qtl at ₹1,800/q.", recommendation: "Limited supply keeps prices firm." },
  { crop: "Pointed Gourd (Parwal)", variety: "Fresh Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 177, lowestPrice: 3600, highestPrice: 4000, averagePrice: 3800, currentPrice: 3800, previousPrice: 3700, changePercent: 2.7, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Parwal trading at ₹3,800/q with 177 Qtl arrivals.", recommendation: "Strong festive and daily retail demand." },
  { crop: "Jackfruit (Raw)", variety: "Raw Vegetable Grade", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1600, highestPrice: 2400, averagePrice: 2000, currentPrice: 2000, previousPrice: 2000, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Jackfruit reference ₹2,000/q.", recommendation: "Specialty culinary procurement." },
  { crop: "Sweet Potato", variety: "Red Skin White Flesh", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 168, lowestPrice: 2000, highestPrice: 3000, averagePrice: 2500, currentPrice: 2500, previousPrice: 2400, changePercent: 4.1, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Sweet potato arrivals 168 Qtl averaging ₹2,500/q.", recommendation: "Fasting and festive demand supporting price firmness." },
  { crop: "Drumstick (Moringa)", variety: "Green Long Pods", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 721, lowestPrice: 3000, highestPrice: 4000, averagePrice: 3500, currentPrice: 3500, previousPrice: 3300, changePercent: 6.0, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Drumstick recorded 721 Qtl with strong rate of ₹3,500/q.", recommendation: "South Indian restaurant vendors actively purchasing." },
  { crop: "Ridge Gourd", variety: "Tender Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 180, lowestPrice: 1400, highestPrice: 2400, averagePrice: 1900, currentPrice: 1900, previousPrice: 1850, changePercent: 2.7, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Ridge gourd modal price ₹1,900/q with 180 Qtl arrivals.", recommendation: "Tender fresh lots achieve top price." },
  { crop: "Elephant Foot Yam (Suran)", variety: "Large Grade", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 500, lowestPrice: 2000, highestPrice: 2600, averagePrice: 2300, currentPrice: 2300, previousPrice: 2250, changePercent: 2.2, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Suran arrivals 500 Qtl at ₹2,300/q average rate.", recommendation: "Stable wholesale turnover." },
  { crop: "Tomato", variety: "Grade 1 Red Hybrid (Abhinav)", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 1893, lowestPrice: 1800, highestPrice: 2200, averagePrice: 2000, currentPrice: 2000, previousPrice: 1900, changePercent: 5.2, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Tomato No. 1 recorded high arrival of 1,893 Qtl averaging ₹2,000/q (₹20/kg).", recommendation: "High retail & FMCG procurement interest across Western India." },
  { crop: "Tomato", variety: "Grade 2 Processing / Table", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1200, highestPrice: 1600, averagePrice: 1400, currentPrice: 1400, previousPrice: 1400, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Grade 2 Tomato reference ₹1,400/q.", recommendation: "Target sauce & puree processors." },
  { crop: "Ivy Gourd (Kundru)", variety: "Small Tender", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 232, lowestPrice: 3000, highestPrice: 4000, averagePrice: 3500, currentPrice: 3500, previousPrice: 3400, changePercent: 2.9, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Tondli Kali trading at ₹3,500/q with 232 Qtl volume.", recommendation: "Supermarket pre-pack supply." },
  { crop: "Ivy Gourd (Kundru)", variety: "Medium Thick", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 2000, highestPrice: 2600, averagePrice: 2300, currentPrice: 2300, previousPrice: 2300, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Thick Tondli benchmark ₹2,300/q.", recommendation: "Local caterers and mess suppliers." },
  { crop: "Green Peas", variety: "Fresh Green Pods", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 791, lowestPrice: 6000, highestPrice: 6500, averagePrice: 6250, currentPrice: 6250, previousPrice: 6000, changePercent: 4.1, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Green peas recorded 791 Qtl arrival with strong price of ₹6,250/q (₹62.50/kg).", recommendation: "High margin commodity for immediate farm-gate truck dispatch." },
  { crop: "Field Beans", variety: "Fresh Green Pods", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 118, lowestPrice: 4000, highestPrice: 5000, averagePrice: 4500, currentPrice: 4500, previousPrice: 4300, changePercent: 4.6, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Walwad beans modal price ₹4,500/q.", recommendation: "Premium local vegetable demand." },
  { crop: "Brinjal (Spiny)", variety: "Purple-Green Oval", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 334, lowestPrice: 1600, highestPrice: 2000, averagePrice: 1800, currentPrice: 1800, previousPrice: 1750, changePercent: 2.8, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Kateri brinjal 334 Qtl arrival at ₹1,800/q.", recommendation: "Regular daily wholesale turnover." },
  { crop: "Brinjal (Black)", variety: "Black Round / Oval", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1600, highestPrice: 2000, averagePrice: 1800, currentPrice: 1800, previousPrice: 1800, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Black brinjal benchmark ₹1,800/q.", recommendation: "Standard hospitality procurement." },
  { crop: "Green Chilli", variety: "Jwala Spicy Green", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 1183, lowestPrice: 3000, highestPrice: 4000, averagePrice: 3500, currentPrice: 3500, previousPrice: 3300, changePercent: 6.0, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Jwala green chilli saw heavy arrival of 1,183 Qtl averaging ₹3,500/q.", recommendation: "High spice processor demand for fresh harvested pungent lots." },
  { crop: "Green Chilli", variety: "Lavangi Hot", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 1600, highestPrice: 2000, averagePrice: 1800, currentPrice: 1800, previousPrice: 1800, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Lavangi chilli reference rate ₹1,800/q.", recommendation: "Bulk retail packing." },
  { crop: "Curry Leaves", variety: "Fresh Aromatic Leaves", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 152, lowestPrice: 3000, highestPrice: 4000, averagePrice: 3500, currentPrice: 3500, previousPrice: 3400, changePercent: 2.9, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Curry leaves recorded 152 Qtl at ₹3,500/q.", recommendation: "Bundle packing protects freshness in transit." },
  { crop: "Spring Onion", variety: "Nashik Fresh Bunch", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 379, lowestPrice: 1000, highestPrice: 1500, averagePrice: 1250, currentPrice: 1250, previousPrice: 1200, changePercent: 4.1, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Nashik spring onion arrivals 379 Qtl at ₹1,250/q.", recommendation: "Hotel and restaurant buyers preferential pickup." },
  { crop: "Spring Onion", variety: "Pune Fresh Bunch", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 700, highestPrice: 900, averagePrice: 800, currentPrice: 800, previousPrice: 800, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Pune spring onion benchmark ₹800/q.", recommendation: "Regular local markets." },
  { crop: "Coriander", variety: "Grade A Bunch", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 684, lowestPrice: 700, highestPrice: 800, averagePrice: 750, currentPrice: 750, previousPrice: 700, changePercent: 7.1, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Coriander arrived at 684 Qtl volume with ₹750/q rate.", recommendation: "Fast morning auction movement." },
  { crop: "Coriander", variety: "Medium Bunch", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 500, highestPrice: 600, averagePrice: 550, currentPrice: 550, previousPrice: 550, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Coriander benchmark ₹550/q.", recommendation: "Competitive bulk sourcing." },
  { crop: "Fenugreek (Methi)", variety: "Tender Green Leaves", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 140, lowestPrice: 800, highestPrice: 1000, averagePrice: 900, currentPrice: 900, previousPrice: 850, changePercent: 5.8, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Methi recorded 140 Qtl at ₹900/q.", recommendation: "High retail preference for small tender leaves." },
  { crop: "Fenugreek (Methi)", variety: "Regular Leafy", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 800, highestPrice: 900, averagePrice: 850, currentPrice: 850, previousPrice: 850, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Methi regular quotation ₹850/q.", recommendation: "Direct city retail supply." },
  { crop: "Radish", variety: "White Long Crisp", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 90, lowestPrice: 3000, highestPrice: 4000, averagePrice: 3500, currentPrice: 3500, previousPrice: 3300, changePercent: 6.0, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Radish trading firm at ₹3,500/q with 90 Qtl arrivals.", recommendation: "High price for washed, leaf-attached fresh bunches." },
  { crop: "Spinach (Palak)", variety: "Broad Leaf", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 566, lowestPrice: 700, highestPrice: 900, averagePrice: 800, currentPrice: 800, previousPrice: 750, changePercent: 6.6, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Palak volume 566 Qtl with average rate ₹800/q.", recommendation: "Daily morning demand from Mumbai wet markets." },
  { crop: "Spinach (Palak)", variety: "Medium Leaf", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 500, highestPrice: 600, averagePrice: 550, currentPrice: 550, previousPrice: 550, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Palak benchmark ₹550/q.", recommendation: "Institutional canteen bulk supplies." },
  { crop: "Mint (Pudina)", variety: "Fresh Aromatic", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 118, lowestPrice: 400, highestPrice: 500, averagePrice: 450, currentPrice: 450, previousPrice: 450, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Mint volume 118 Qtl at ₹450/q.", recommendation: "Juice center and beverage manufacturer sourcing." },
  { crop: "Dill Leaves", variety: "Fresh Green Bunch", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 12, lowestPrice: 800, highestPrice: 900, averagePrice: 850, currentPrice: 850, previousPrice: 800, changePercent: 6.2, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Dill leaves 12 Qtl arrival at ₹850/q.", recommendation: "Direct suburban retail distribution." },
  { crop: "Dill Leaves", variety: "Regular Bunch", mandi: "Mumbai APMC (Vashi)", state: "Maharashtra", arrivalVolume: 0, lowestPrice: 700, highestPrice: 800, averagePrice: 750, currentPrice: 750, previousPrice: 750, changePercent: 0.0, priceTrend: "stable", reportDate: "2026-09-05", insightSummary: "Dill leaves reference ₹750/q.", recommendation: "Regular local demand." },
  { crop: "Onion", variety: "Nashik Red Garwa", mandi: "Lasalgaon Mandi", state: "Maharashtra", arrivalVolume: 3600, lowestPrice: 2200, highestPrice: 2600, averagePrice: 2450, currentPrice: 2450, previousPrice: 2360, changePercent: 3.8, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Lasalgaon benchmark is ₹2,450/q with robust 360 MT arrivals.", recommendation: "Hold buffer stock for 10-14 days for festive premium." },
  { crop: "Potato", variety: "Kufri Jyoti (Chips Grade)", mandi: "Indore APMC", state: "Madhya Pradesh", arrivalVolume: 3300, lowestPrice: 2000, highestPrice: 2300, averagePrice: 2150, currentPrice: 2150, previousPrice: 2190, changePercent: -1.8, priceTrend: "down", reportDate: "2026-09-05", insightSummary: "Indore reference rate ₹2,150/q with steady cold storage releases.", recommendation: "Lock forward farm-gate agreements." },
  { crop: "Wheat", variety: "Sharbati C-306 Gold", mandi: "Karnal Mandi", state: "Haryana", arrivalVolume: 5200, lowestPrice: 2600, highestPrice: 2850, averagePrice: 2720, currentPrice: 2720, previousPrice: 2680, changePercent: 1.5, priceTrend: "up", reportDate: "2026-09-05", insightSummary: "Karnal Sharbati wheat trading firm at ₹2,720/q.", recommendation: "Premium millers offering ₹2,850/q for moisture <10%." }
];

let produceListingsData = [
  {
    id: "prod-1",
    farmer_name: "Rajendra Patel",
    farm_name: "Patel Organic Farms",
    crop: "Tomato",
    variety: "Abhinav Hybrid Tomato",
    quantity: 50,
    unit: "Quintals",
    expected_price: 2800,
    quality: "Grade A",
    harvest_date: "05 Sep 2026",
    location: "Nashik (18 km away)",
    status: "Active on Marketplace",
    image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-2",
    farmer_name: "Green Valley Farms",
    farm_name: "Green Valley Farms",
    crop: "Wheat",
    variety: "Sharbati Gold Wheat",
    quantity: 200,
    unit: "Quintals",
    expected_price: 2750,
    quality: "Grade A+ Export",
    harvest_date: "12 Sep 2026",
    location: "Indore, MP",
    status: "Active on Marketplace",
    image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-3",
    farmer_name: "Sahyadri Agro Producer",
    farm_name: "Sahyadri Agro Producer",
    crop: "Onion",
    variety: "Nashik Garwa Onion",
    quantity: 80,
    unit: "Quintals",
    expected_price: 2450,
    quality: "Grade A",
    harvest_date: "08 Sep 2026",
    location: "Lasalgaon, Nashik",
    status: "Under Negotiation",
    image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80"
  }
];

let purchaseRequestsData = [
  {
    id: "req-101",
    listing_id: "prod-1",
    crop_name: "Tomato (Abhinav Hybrid)",
    crop: "Tomato",
    buyer_name: "Mumbai Fresh Mart Ltd",
    buyer_company: "Mumbai Fresh Mart",
    is_buyer_verified: true,
    offered_price_per_unit: 2800,
    offered_price: 2800,
    requested_quantity: 50,
    quantity: 50,
    unit: "quintal",
    total_offer_amount: 140000,
    delivery_location: "Bhiwandi Central Depot",
    status: "pending",
    current_offer_by: "buyer",
    created_at: new Date().toISOString()
  },
  {
    id: "req-102",
    listing_id: "prod-1",
    crop_name: "Tomato (Abhinav Hybrid)",
    crop: "Tomato",
    buyer_name: "FreshCart Wholesale Co",
    buyer_company: "FreshCart Wholesale",
    is_buyer_verified: true,
    offered_price_per_unit: 2700,
    offered_price: 2700,
    requested_quantity: 50,
    quantity: 50,
    unit: "quintal",
    total_offer_amount: 135000,
    delivery_location: "Kalyan Wholesale Hub",
    status: "pending",
    current_offer_by: "buyer",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "req-103",
    listing_id: "prod-1",
    crop_name: "Tomato (Abhinav Hybrid)",
    crop: "Tomato",
    buyer_name: "City Foods Enterprise",
    buyer_company: "City Foods Enterprise",
    is_buyer_verified: false,
    offered_price_per_unit: 2900,
    offered_price: 2900,
    requested_quantity: 50,
    quantity: 50,
    unit: "quintal",
    total_offer_amount: 145000,
    delivery_location: "Vashi Terminal",
    status: "pending",
    current_offer_by: "buyer",
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

let ordersData = [
  {
    id: "ord-1",
    order_number: "FD-1039",
    crop: "Tomato (Grade A Red)",
    variety: "Abhinav Hybrid Grade A",
    quantity: 50,
    unit: "Quintals",
    price_per_unit: 2800,
    total_amount: 140000,
    buyer_name: "Mumbai Fresh Mart",
    buyer_company: "Mumbai Fresh Mart",
    farmer_name: "Rajendra Patel",
    farmer_farm: "Patel Organic Farms",
    delivery_location: "Bhiwandi Central Hub",
    status: "Confirmed",
    payment_status: "Pending",
    transport_confirmed: false,
    order_date: "11 Sep 2026",
    tracking_steps: [
      { title: "Deal Agreed", completed: true, current: false, date: "11 Sep", description: "Terms accepted." },
      { title: "Confirm Transport", completed: false, current: true, date: "Pending", description: "Farmer must confirm transport readiness." },
      { title: "Buyer Escrow Deposit", completed: false, current: false, description: "Smart escrow deposit." },
      { title: "Logistics & Dispatch", completed: false, current: false, description: "Vehicle assignment & dispatch." },
      { title: "Destination Assay", completed: false, current: false, description: "Assay verification on arrival." },
      { title: "Smart Payout", completed: false, current: false, description: "Instant escrow disbursement." }
    ]
  }
];

const server = http.createServer((req, res) => {
  // Add universal CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id, *');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

  // Helper to parse JSON body
  const parseJsonBody = (callback) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        callback(null, parsed);
      } catch (e) {
        callback(e, null);
      }
    });
  };

  // API Endpoint: /api/market-prices
  if (reqUrl === '/api/market-prices' || reqUrl === '/api/market-prices/') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({
      success: true,
      count: apmcPdfData.length,
      data: apmcPdfData
    }));
    return;
  }

  // API Endpoint: /api/produce & /api/produce-listings
  if (reqUrl === '/api/produce' || reqUrl === '/api/produce/' || reqUrl === '/api/produce-listings' || reqUrl === '/api/produce-listings/') {
    if (req.method === 'POST') {
      parseJsonBody((err, item) => {
        if (err || !item) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          return;
        }
        item.id = item.id || `prod-${Date.now()}`;
        item.created_at = item.created_at || new Date().toISOString();
        item.status = item.status || 'Active on Marketplace';
        produceListingsData.unshift(item);
        res.writeHead(201, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ success: true, data: item }));
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({
      success: true,
      count: produceListingsData.length,
      data: produceListingsData
    }));
    return;
  }

  // API Endpoint: /api/purchase-requests (Incoming Offers)
  if (reqUrl === '/api/purchase-requests' || reqUrl === '/api/purchase-requests/') {
    if (req.method === 'POST') {
      parseJsonBody((err, offer) => {
        if (err || !offer) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          return;
        }
        offer.id = offer.id || `req-${Date.now()}`;
        offer.created_at = offer.created_at || new Date().toISOString();
        offer.status = offer.status || 'pending';
        offer.current_offer_by = offer.current_offer_by || 'buyer';
        offer.total_offer_amount = offer.total_offer_amount || (Number(offer.requested_quantity || 10) * Number(offer.offered_price_per_unit || 2800));
        purchaseRequestsData.unshift(offer);
        res.writeHead(201, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ success: true, data: offer }));
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({
      success: true,
      count: purchaseRequestsData.length,
      data: purchaseRequestsData
    }));
    return;
  }

  // API Endpoint: /api/purchase-requests/:id/counter
  const counterMatch = reqUrl.match(/^\/api\/purchase-requests\/([^\/]+)\/counter\/?$/);
  if (counterMatch && req.method === 'POST') {
    const offerId = counterMatch[1];
    parseJsonBody((err, body) => {
      const offer = purchaseRequestsData.find(o => o.id === offerId);
      if (offer) {
        offer.status = 'countered';
        offer.current_offer_by = body.role || 'farmer';
        if (body.price_per_unit) {
          offer.offered_price_per_unit = Number(body.price_per_unit);
          offer.offered_price = Number(body.price_per_unit);
        }
        if (body.quantity) {
          offer.requested_quantity = Number(body.quantity);
          offer.quantity = Number(body.quantity);
        }
        offer.total_offer_amount = (offer.offered_price_per_unit || 2800) * (offer.requested_quantity || 1);
        offer.counter_message = body.message || '';
        offer.updated_at = new Date().toISOString();
      }
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify({ success: true, data: offer || { id: offerId, status: 'countered' } }));
    });
    return;
  }

  // API Endpoint: /api/purchase-requests/:id/reject
  const rejectMatch = reqUrl.match(/^\/api\/purchase-requests\/([^\/]+)\/reject\/?$/);
  if (rejectMatch && req.method === 'POST') {
    const offerId = rejectMatch[1];
    const offer = purchaseRequestsData.find(o => o.id === offerId);
    if (offer) {
      offer.status = 'rejected';
      offer.updated_at = new Date().toISOString();
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({ success: true, message: 'Offer declined' }));
    return;
  }

  // API Endpoint: /api/purchase-requests/:id/accept
  const acceptMatch = reqUrl.match(/^\/api\/purchase-requests\/([^\/]+)\/accept\/?$/);
  if (acceptMatch && req.method === 'POST') {
    const offerId = acceptMatch[1];
    const offer = purchaseRequestsData.find(o => o.id === offerId);
    if (offer) {
      offer.status = 'accepted';
      offer.updated_at = new Date().toISOString();
      // Auto-generate order
      ordersData.unshift({
        id: `ord-${Date.now()}`,
        order_number: `FD-${Math.floor(1000 + Math.random() * 9000)}`,
        crop: offer.crop_name || offer.crop || "Produce",
        variety: "Grade A Harvest",
        quantity: offer.requested_quantity || 50,
        unit: offer.unit || "quintal",
        price_per_unit: offer.offered_price_per_unit || 2800,
        total_amount: offer.total_offer_amount || 140000,
        buyer_name: offer.buyer_company || offer.buyer_name || "Verified Buyer",
        buyer_company: offer.buyer_company || offer.buyer_name || "Verified Buyer",
        farmer_name: "Rajendra Patel",
        farmer_farm: "Patel Organic Farms",
        delivery_location: offer.delivery_location || "Central Distribution Depot",
        status: "Confirmed",
        payment_status: "Pending",
        transport_confirmed: false,
        order_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        tracking_steps: [
          { title: "Deal Agreed", completed: true, current: false, date: "Just now", description: "Terms accepted." },
          { title: "Confirm Transport", completed: false, current: true, date: "Pending", description: "Farmer must confirm transport readiness." },
          { title: "Buyer Escrow Deposit", completed: false, current: false, description: "Smart escrow deposit." },
          { title: "Logistics & Dispatch", completed: false, current: false, description: "Vehicle assignment & dispatch." },
          { title: "Destination Assay & Weighment", completed: false, current: false, description: "Verification on arrival." },
          { title: "Smart Payout", completed: false, current: false, description: "Instant disbursement upon arrival." }
        ]
      });
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({ success: true, message: 'Offer accepted' }));
    return;
  }

  // API Endpoint: /api/orders
  if (reqUrl === '/api/orders' || reqUrl === '/api/orders/') {
    if (req.method === 'POST') {
      parseJsonBody((err, order) => {
        if (err || !order) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          return;
        }
        order.id = order.id || `ord-${Date.now()}`;
        order.order_number = order.order_number || `FD-${Math.floor(1000 + Math.random() * 9000)}`;
        order.order_date = order.order_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        order.status = order.status || 'Confirmed';
        order.payment_status = order.payment_status || 'Pending';
        order.transport_confirmed = order.transport_confirmed ?? false;
        ordersData.unshift(order);
        res.writeHead(201, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ success: true, data: order }));
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({
      success: true,
      count: ordersData.length,
      data: ordersData
    }));
    return;
  }

  // API Endpoints: Order Actions (/api/orders/:id/confirm-transport, /escrow/lock, /dispatch, /arrive, /verify, /release-payout)
  const orderActionMatch = reqUrl.match(/^\/api\/orders\/([^\/]+)\/(confirm-transport|arrive|verify|release-payout|escrow\/release|escrow\/lock|dispatch)$/);
  if (orderActionMatch && req.method === 'POST') {
    const orderId = orderActionMatch[1];
    const action = orderActionMatch[2];

    parseJsonBody((err, body) => {
      const order = ordersData.find(o => o.id === orderId || o.order_number === orderId);
      if (!order) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Order not found' }));
        return;
      }

      const bodyData = body || {};
      const userRole = (bodyData.user_role || req.headers['x-user-role'] || '').toString().toLowerCase();

      // ACTION 1: Farmer Confirms Transport
      if (action === 'confirm-transport') {
        if (userRole && userRole !== 'farmer' && userRole !== 'seller') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Only the farmer/seller can confirm transport readiness.' }));
          return;
        }

        if (order.status !== 'Confirmed') {
          if (order.status === 'Transport Confirmed' || order.transport_confirmed) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Transport already confirmed', data: order }));
            return;
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: `Cannot confirm transport. Order status is '${order.status}'.` }));
          return;
        }

        order.status = 'Transport Confirmed';
        order.transport_confirmed = true;
        order.transport_confirmed_at = new Date().toISOString();
        order.transport_confirmed_by = bodyData.confirmed_by || order.farmer_name || 'Farmer';

        if (order.tracking_steps && Array.isArray(order.tracking_steps)) {
          if (order.tracking_steps[0]) {
            order.tracking_steps[0].completed = true;
            order.tracking_steps[0].current = false;
          }
          if (order.tracking_steps[1]) {
            order.tracking_steps[1].completed = true;
            order.tracking_steps[1].current = false;
            order.tracking_steps[1].date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          }
          if (order.tracking_steps[2]) {
            order.tracking_steps[2].current = true;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Farmer confirmed transport readiness. Buyer can now lock escrow.', data: order }));
        return;
      }

      // ACTION 2: Buyer Locks Escrow
      if (action === 'escrow/lock') {
        if (userRole && userRole !== 'buyer' && userRole !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Only the buyer can lock escrow funds.' }));
          return;
        }

        const isTransportConfirmed = order.status === 'Transport Confirmed' || order.transport_confirmed === true;
        if (!isTransportConfirmed && order.status === 'Confirmed') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Cannot lock escrow: Farmer must confirm transport readiness before Buyer can lock escrow.' }));
          return;
        }

        if (order.payment_status === 'Escrow Locked') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Escrow already locked', data: order }));
          return;
        }

        order.status = 'Escrow Locked';
        order.payment_status = 'Escrow Locked';
        order.escrow_locked_at = new Date().toISOString();
        if (order.tracking_steps && Array.isArray(order.tracking_steps)) {
          if (order.tracking_steps[1]) {
            order.tracking_steps[1].completed = true;
            order.tracking_steps[1].current = false;
          }
          if (order.tracking_steps[2]) {
            order.tracking_steps[2].completed = true;
            order.tracking_steps[2].current = false;
            order.tracking_steps[2].date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          }
          if (order.tracking_steps[3]) {
            order.tracking_steps[3].current = true;
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Escrow locked successfully in smart escrow vault', data: order }));
        return;
      }

      // ACTION 3: Buyer Dispatches Transport
      if (action === 'dispatch') {
        if (userRole && userRole !== 'buyer' && userRole !== 'logistics' && userRole !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Only the buyer or logistics partner can dispatch transport.' }));
          return;
        }

        if (order.payment_status !== 'Escrow Locked') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Cannot dispatch shipment: Escrow must be locked first.' }));
          return;
        }

        order.status = 'In Transit';
        order.dispatched_at = new Date().toISOString();
        if (order.tracking_steps && Array.isArray(order.tracking_steps)) {
          if (order.tracking_steps[3]) {
            order.tracking_steps[3].completed = true;
            order.tracking_steps[3].current = false;
            order.tracking_steps[3].date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          }
          if (order.tracking_steps[4]) {
            order.tracking_steps[4].current = true;
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Shipment dispatched successfully', data: order }));
        return;
      }

      // ACTION 4: Buyer Marks Arrived
      if (action === 'arrive') {
        if (userRole && userRole === 'farmer') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Farmer cannot mark shipment arrival.' }));
          return;
        }

        if (order.status !== 'In Transit' && order.status !== 'in_transit') {
          if (order.status === 'Arrived' || order.status === 'Quality Verified') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: order }));
            return;
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: `Order must be In Transit before it can be marked as Arrived. Current status: ${order.status}` }));
          return;
        }

        order.status = 'Arrived';
        order.arrived_at = new Date().toISOString();
        order.arrived_by = bodyData.arrived_by || 'Destination Hub Inspector';
        order.arrival_remarks = bodyData.arrival_remarks || 'Shipment arrived at destination';
        if (order.tracking_steps && Array.isArray(order.tracking_steps)) {
          if (order.tracking_steps[4]) {
            order.tracking_steps[4].completed = true;
            order.tracking_steps[4].current = false;
            order.tracking_steps[4].date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          }
          if (order.tracking_steps[5]) {
            order.tracking_steps[5].current = true;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Shipment arrival recorded', data: order }));
        return;
      }

      // ACTION 5: Buyer Verifies Weight & Quality
      if (action === 'verify') {
        if (userRole && userRole === 'farmer') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Farmer cannot verify weight and quality.' }));
          return;
        }

        if (order.status !== 'Arrived' && order.status !== 'Delivered') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: `Order must be Arrived before verification. Current status: ${order.status}` }));
          return;
        }

        const actualQty = Number(bodyData.actual_received_quantity);
        if (isNaN(actualQty) || actualQty <= 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Actual received quantity must be greater than 0' }));
          return;
        }

        if (!bodyData.quality_grade) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Quality grade is required' }));
          return;
        }

        const isPassed = (bodyData.assay_result || '').toLowerCase() === 'passed';
        order.actual_received_quantity = actualQty;
        order.actual_quantity_unit = bodyData.actual_quantity_unit || order.unit || 'kg';
        order.quality_grade = bodyData.quality_grade;
        order.assay_result = isPassed ? 'Passed' : 'Failed';
        order.assay_notes = bodyData.assay_notes || null;
        order.verification_remarks = bodyData.verification_remarks || null;
        order.verified_at = new Date().toISOString();
        order.verified_by = bodyData.verified_by || 'Quality Verifier';

        if (!isPassed) {
          order.status = 'Disputed';
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Quality verification failed. Payout cannot be released.', data: order }));
          return;
        }

        order.status = 'Quality Verified';
        const pricePerUnit = Number(order.price_per_unit || (order.quantity ? order.total_amount / order.quantity : 2800));
        order.payout_amount = Math.round(actualQty * pricePerUnit * 100) / 100;

        if (order.tracking_steps && Array.isArray(order.tracking_steps)) {
          if (order.tracking_steps[4]) {
            order.tracking_steps[4].completed = true;
            order.tracking_steps[4].current = false;
            order.tracking_steps[4].date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          }
          if (order.tracking_steps[5]) {
            order.tracking_steps[5].current = true;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Weight & Quality verified successfully', data: order }));
        return;
      }

      // ACTION 6: Buyer Releases Payout
      if (action === 'release-payout' || action === 'escrow/release') {
        if (userRole && userRole === 'farmer') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Farmer cannot release escrow payout.' }));
          return;
        }

        if (order.status === 'Completed' || order.payment_status === 'Released') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Payout already released', data: order }));
          return;
        }

        if (order.payment_status !== 'Escrow Locked') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Escrow must be locked before payout can be released' }));
          return;
        }

        if (order.status !== 'Quality Verified' && order.status !== 'Delivered' && order.status !== 'Arrived') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Weight and quality must be verified before releasing payout' }));
          return;
        }

        const verifiedQty = order.actual_received_quantity ? Number(order.actual_received_quantity) : Number(order.quantity);
        const pricePerUnit = Number(order.price_per_unit || (order.total_amount / order.quantity));
        const payoutAmount = Math.round(verifiedQty * pricePerUnit * 100) / 100;

        order.status = 'Completed';
        order.payment_status = 'Released';
        order.payout_status = 'Released';
        order.payout_amount = payoutAmount;
        order.payout_released_at = new Date().toISOString();
        order.payout_released_by = 'Smart Escrow Contract';
        order.payout_reference = `TX-PAY-${Date.now().toString().slice(-8)}`;

        if (order.tracking_steps && Array.isArray(order.tracking_steps)) {
          order.tracking_steps.forEach(step => {
            step.completed = true;
            step.current = false;
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Payout of ₹${payoutAmount.toLocaleString('en-IN')} released to farmer`, data: order }));
        return;
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unknown action' }));
    });
    return;
  }

  let cleanPath = reqUrl.replace(/^[\/\\]+/, '').replace(/\.\.[\/\\]/g, '');
  
  if (!cleanPath) {
    cleanPath = 'index.html';
  }

  let filePath = path.join(ROOT_DIR, cleanPath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });

      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Default Fallback to root index.html
    const fallbackPath = path.join(ROOT_DIR, 'index.html');
    fs.readFile(fallbackPath, (fallbackErr, data) => {
      if (fallbackErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fieldora running with Real APMC Mandi Data at http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/`);
});
