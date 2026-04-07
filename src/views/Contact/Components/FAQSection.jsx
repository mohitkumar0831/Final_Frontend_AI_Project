import React from 'react';

const faqs = [
  { 
    q: "How long does a demo take?", 
    a: "Typically 30-45 minutes, depending on your questions and the depth of discussion." 
  },
  { 
    q: "Is there a free trial?", 
    a: "Yes! We offer a 7-days free trial with full access to all features." 
  },
  { 
    q: "What integrations do you support?", 
    a: "We integrate with 50+ ATS platforms including Workday, Greenhouse, Lever, and more." 
  },
  { 
    q: "How quickly can we get started?", 
    a: "Most customers are up and running within 24 hours of signing up." 
  }
];

export default function FAQSection() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1140] mb-2 md:mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 text-xs md:text-sm">Quick answers to common questions</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base">{faq.q}</h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
