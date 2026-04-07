import React from 'react';
import { Calendar, CheckCircle, Globe, MapPin } from 'lucide-react';

const expectationItems = [
  'Personalized walkthrough of all features',
  'See real examples from your industry',
  'Get answers to all your questions',
  'No commitment required'
];

const offices = [
  { city: "World Trade Center,", addr: "Tower 2, Level 9, Kharadi, Pune, Maharashtra", label: "Headquarters" },
  { city: "Kolkata, West Bengal", addr: "Sector V", label: "EMEA Office" },
  { city: "Singapore, Singapore", addr: "78 Digital Road", label: "APAC Office" },
];

export default function InfoPanels() {
  return (
    <div className="space-y-6 md:space-y-8">
      
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-50 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base md:text-lg">What to Expect</h3>
        </div>
        <ul className="space-y-3 md:space-y-4">
          {expectationItems.map((text, i) => (
            <li key={i} className="flex gap-3 text-xs md:text-sm text-gray-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" /> 
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-50 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Globe size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base md:text-lg">Global Offices</h3>
        </div>
        <div className="space-y-4 md:space-y-6">
          {offices.map((off, i) => (
            <div key={i} className="flex gap-3 md:gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <MapPin size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-xs md:text-sm font-bold text-gray-900">{off.city}</h4>
                <p className="text-[10px] md:text-xs text-gray-500">{off.addr}</p>
                <span className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {off.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
