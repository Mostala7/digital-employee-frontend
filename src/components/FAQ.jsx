import { useState } from "react";
import "./FAQ.css";

const faqData = [
  {
    id: 1,
    question: "What is IRIS and how does it work?",
    answer:
      "IRIS is an AI-powered customer intelligence platform that connects to your communication channels, responds to customers instantly, analyzes conversations in real time, and generates actionable insights. It transforms calls and chats into structured data to help businesses improve support quality and make smarter decisions.",
  },
  {
    id: 2,
    question: "Can IRIS provide 24/7 customer support?",
    answer:
      "Yes. IRIS delivers automated responses around the clock. It answers common questions instantly, detects customer intent and sentiment, and creates support tickets for complex issues — ensuring no message goes unanswered.",
  },
  {
    id: 3,
    question: "Can I customize the AI agent?",
    answer:
      "Absolutely. You can upload your knowledge base (FAQs, policies, menus, pricing), adjust the tone of voice, customize brand colors, and configure voice settings for call responses. This ensures the AI agent represents your brand identity accurately.",
  },
  {
    id: 4,
    question: "Is IRIS suitable for small businesses and large enterprises?",
    answer:
      "Yes. IRIS offers scalable pricing plans designed for startups, growing businesses, and large enterprises. You can start with a free trial and upgrade as your business expands.",
  },
];

const FAQ = () => {
  // Set the first item as open by default, matching the screenshot
  const [openId, setOpenId] = useState(1);

  const toggleAccordion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        <div className="faq-content">
          <h2 className="faq-title">Frequently Asked Questions</h2>

          <div className="faq-list">
            {faqData.map((faq) => (
              <div
                key={faq.id}
                className={`faq-item ${openId === faq.id ? "open" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={openId === faq.id}
                >
                  {faq.question}
                  <span className="faq-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </button>
                <div className="faq-answer-wrapper">
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
