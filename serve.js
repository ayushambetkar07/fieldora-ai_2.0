import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
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

const server = http.createServer((req, res) => {
  // Add universal CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

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
