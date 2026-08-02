import React from 'react';
import { DoctorUser } from '../types.ts';
import { Award, Clock, Star, MapPin, Calendar, ArrowRight } from 'lucide-react';

interface DoctorCardProps {
  doctor: DoctorUser;
  onBookClick: (doctor: DoctorUser) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookClick }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <img
            src={doctor.avatarUrl}
            alt={doctor.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-100 shadow-inner flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {doctor.department}
              </span>
              <div className="flex items-center gap-1 text-blue-600 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                <Star className="w-3.5 h-3.5 fill-blue-500" />
                <span>{doctor.rating.toFixed(1)}</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-1.5 truncate group-hover:text-blue-700 transition-colors">
              {doctor.name}
            </h3>
            <p className="text-xs font-medium text-slate-600 truncate">{doctor.specialty}</p>
            <p className="text-xs text-slate-500 mt-0.5">{doctor.qualification}</p>
          </div>
        </div>

        {/* Unique Cases Handled */}
        <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>Unique Expertise & Cases:</span>
          </div>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {doctor.uniqueCases}
          </p>
        </div>

        {/* Info pills */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{doctor.experienceYears} Years Exp.</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{doctor.roomNo || 'OPD Clinic'}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 block">Consultation Fee</span>
          <span className="text-sm font-bold text-slate-900">₹{doctor.consultationFee}</span>
        </div>

        <button
          onClick={() => onBookClick(doctor)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-150 active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Slot</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
