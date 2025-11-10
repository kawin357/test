import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { X, Upload, Send } from 'lucide-react';

interface CareerApplicationFormProps {
  job: {
    title: string;
    department: string;
    location: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const CareerApplicationForm = ({ job, isOpen, onClose }: CareerApplicationFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    currentCompany: '',
    coverLetter: '',
    resume: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Application submitted successfully! We will contact you soon.');
    onClose();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      experience: '',
      currentCompany: '',
      coverLetter: '',
      resume: null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] });
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[40rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[1.5rem] font-bold text-gray-900">
            Apply for {job.title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {job.department} • {job.location}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-[1.5rem] mt-[1rem]">
          <div className="space-y-[0.5rem]">
            <Label htmlFor="fullName" className="text-[0.875rem] font-medium">
              Full Name *
            </Label>
            <Input
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1rem]">
            <div className="space-y-[0.5rem]">
              <Label htmlFor="email" className="text-[0.875rem] font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-[0.5rem]">
              <Label htmlFor="phone" className="text-[0.875rem] font-medium">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1rem]">
            <div className="space-y-[0.5rem]">
              <Label htmlFor="experience" className="text-[0.875rem] font-medium">
                Years of Experience *
              </Label>
              <Input
                id="experience"
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g., 5 years"
              />
            </div>

            <div className="space-y-[0.5rem]">
              <Label htmlFor="currentCompany" className="text-[0.875rem] font-medium">
                Current Company
              </Label>
              <Input
                id="currentCompany"
                value={formData.currentCompany}
                onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                placeholder="Current employer"
              />
            </div>
          </div>

          <div className="space-y-[0.5rem]">
            <Label htmlFor="coverLetter" className="text-[0.875rem] font-medium">
              Cover Letter / Why are you interested? *
            </Label>
            <Textarea
              id="coverLetter"
              required
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              placeholder="Tell us why you're a great fit for this role..."
              className="min-h-[8rem] resize-none"
            />
          </div>

          <div className="space-y-[0.5rem]">
            <Label htmlFor="resume" className="text-[0.875rem] font-medium">
              Upload Resume (PDF, DOC, DOCX) *
            </Label>
            <div className="flex items-center gap-[0.5rem]">
              <Input
                id="resume"
                type="file"
                required
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="resume"
                className="flex-1 cursor-pointer flex items-center gap-[0.5rem] px-[1rem] py-[0.5rem] border-[0.125rem] border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors"
              >
                <Upload className="w-[1.25rem] h-[1.25rem] text-gray-400" />
                <span className="text-[0.875rem] text-gray-600">
                  {formData.resume ? formData.resume.name : 'Choose file...'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-[1rem] pt-[1rem]">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-[0.75rem] font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Send className="w-[1rem] h-[1rem] mr-[0.5rem]" />
              Submit Application
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-[2rem] py-[0.75rem]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CareerApplicationForm;
