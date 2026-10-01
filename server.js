const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const SYSTEM_INSTRUCTION = `You are the polite, knowledgeable, and professional AI Consultant for "Bluetech" — a modern digital solutions agency.

About Bluetech:
- Motto / Brand: "Build Your Digital Future with Bluetech" | "Digital Solutions for Modern Businesses" | "Together We Grow"
- Location: Karachi, Pakistan (Serving both national and international clients)
- Contact Channels: WhatsApp (+92 300 1234567), Official Email (hello@bluetech.com)

Core Services:
1. Websites with MERN Stack: High-performance, scalable web apps built with MongoDB, Express.js, React, and Node.js. Custom REST/GraphQL APIs, secure authentication, reactive SPAs, and robust backend engineering.
2. Web Designing & UI/UX: Modern, responsive, clean interfaces designed with high aesthetics and UX best practices (Figma to pixel-perfect code). Focused on converting visitors to customers.
3. QuickBooks Solutions & Integration: Professional QuickBooks setup, automated invoicing, bookkeeping sync, custom transaction reporting, and QuickBooks Online API integration.
4. Custom Web Development: Enterprise business websites, speed optimization, SEO-friendly architecture, and long-term maintenance.

CRITICAL RULES:
1. Tone: Always exceptionally polite, welcoming, professional, and encouraging.
2. STRICT PRICING RULE: NEVER quote specific prices, numbers, hourly rates, or dollar fees. If asked about prices or costs, politely explain: "At Bluetech, we customize every solution to match your specific business requirements and scope rather than using rigid fixed packages. We would love to provide you with a tailored estimate and free consultation! You can reach out directly on WhatsApp at +92 300 1234567 or submit our inquiry form."
3. STRICT PROJECTS RULE: If asked about specific past projects or a portfolio, politely inform them that live demonstrations and case studies can be shared during a direct consultation with the engineering team.
4. Next Steps: Always encourage the user to connect on WhatsApp (+92 300 1234567) or send an inquiry via the website contact form to get started.`;


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data folder and inquiries file exist
const DATA_FILE = path.join(__dirname, 'data', 'inquiries.json');
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Helper to read inquiries
function getInquiries() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading inquiries:', err);
    return [];
  }
}

// Helper to save inquiries
function saveInquiries(inquiries) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(inquiries, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing inquiries:', err);
    return false;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Bluetech Agency Backend',
    timestamp: new Date().toISOString()
  });
});

// Endpoint to receive client inquiries via contact/consultation form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email, and project details.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const newInquiry = {
      id: 'INQ-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : 'Not provided',
      service: service || 'General Inquiry',
      message: message.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const inquiries = getInquiries();
    inquiries.unshift(newInquiry);
    saveInquiries(inquiries);

    console.log(`[Bluetech Lead Received] ID: ${newInquiry.id} | From: ${newInquiry.name} (${newInquiry.email}) | Service: ${newInquiry.service}`);

    // If SMTP credentials exist in .env, attempt email delivery via nodemailer
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Email to agency admin
        await transporter.sendMail({
          from: `"Bluetech Website" <${process.env.SMTP_USER}>`,
          to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
          subject: `New Client Inquiry: ${newInquiry.service} - ${newInquiry.name}`,
          html: `
            <h2>New Inquiry Received on Bluetech Website</h2>
            <p><strong>Name:</strong> ${newInquiry.name}</p>
            <p><strong>Email:</strong> ${newInquiry.email}</p>
            <p><strong>Phone / WhatsApp:</strong> ${newInquiry.phone}</p>
            <p><strong>Service Requested:</strong> ${newInquiry.service}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background:#f1f5f9;padding:12px;border-left:4px solid #0070f3;">
              ${newInquiry.message.replace(/\n/g, '<br/>')}
            </blockquote>
            <p><small>Received at ${newInquiry.createdAt}</small></p>
          `
        });
      } catch (mailErr) {
        console.warn('Note: SMTP sending skipped or failed (inquiry saved locally):', mailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to Bluetech! Our team will review your inquiry and respond promptly.',
      inquiryId: newInquiry.id
    });
  } catch (error) {
    console.error('Error processing contact inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your message. Please try again or reach out directly on WhatsApp.'
    });
  }
});

// Endpoint to list inquiries (for admin / dashboard inspection)
app.get('/api/inquiries', (req, res) => {
  const inquiries = getInquiries();
  res.json({
    total: inquiries.length,
    inquiries: inquiries
  });
});

// Endpoint for AI chat powered by Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        reply: "Hello! Welcome to Bluetech. How may I assist you with our MERN stack, Web Design, or QuickBooks integration services today?"
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Construct contents array with history if available
    const contents = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.role && item.text) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 600,
      }
    });

    const reply = response.text || "Thank you for reaching out! How else may I assist you with Bluetech's digital solutions?";

    return res.json({
      success: true,
      reply: reply
    });
  } catch (error) {
    console.error('Gemini Chat API Error:', error.message);
    return res.status(500).json({
      success: false,
      reply: "Thank you for reaching out to Bluetech! I am having a brief moment connecting to our AI server, but our engineering team is readily available on WhatsApp at +92 300 1234567 to assist you immediately."
    });
  }
});

// Fallback to index.html for client routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Bluetech Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files served from /public`);
  console.log(`✉️ Contact API active at POST /api/contact`);
  console.log(`===============================================`);
});
