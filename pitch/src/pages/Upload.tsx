import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMatching } from '@/contexts/MatchingContext';
import { parseMentorCSV, parseMenteeCSV } from '@/lib/csv-parser';

export default function Upload() {
  const [mentorFile, setMentorFile] = useState<File | null>(null);
  const [menteeFile, setMenteeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setMentors, setMentees } = useMatching();

  const handleFileUpload = async (file: File, type: 'mentor' | 'mentee') => {
    if (type === 'mentor') {
      setMentorFile(file);
    } else {
      setMenteeFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'mentor' | 'mentee') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file, type);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
    }
  };

  const handleProceed = async () => {
    if (!mentorFile || !menteeFile) {
      toast({
        title: 'Missing files',
        description: 'Please upload both mentor and mentee files',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const [mentors, mentees] = await Promise.all([
        parseMentorCSV(mentorFile),
        parseMenteeCSV(menteeFile)
      ]);

      setMentors(mentors);
      setMentees(mentees);

      toast({
        title: 'Files uploaded successfully',
        description: `Loaded ${mentors.length} mentors and ${mentees.length} mentees`
      });

      navigate('/criteria');
    } catch (error) {
      toast({
        title: 'Error parsing files',
        description: 'Please check your CSV files and try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Mentor-Mentee Matching Platform
            </h1>
            <p className="text-xl text-muted-foreground">
              Upload your CSV files to begin the intelligent matching process
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <UploadCard
              title="Mentor Data"
              icon={<Users className="w-8 h-8" />}
              file={mentorFile}
              onDrop={(e) => handleDrop(e, 'mentor')}
              onFileSelect={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'mentor');
              }}
              description="Upload mentor CSV file"
            />

            <UploadCard
              title="Mentee Data"
              icon={<FileText className="w-8 h-8" />}
              file={menteeFile}
              onDrop={(e) => handleDrop(e, 'mentee')}
              onFileSelect={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'mentee');
              }}
              description="Upload mentee CSV file"
            />
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleProceed}
              disabled={!mentorFile || !menteeFile || isLoading}
              className="group"
            >
              {isLoading ? 'Processing...' : 'Continue to Criteria'}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UploadCardProps {
  title: string;
  icon: React.ReactNode;
  file: File | null;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description: string;
}

function UploadCard({ title, icon, file, onDrop, onFileSelect, description }: UploadCardProps) {
  return (
    <Card
      className="p-8 border-2 border-dashed hover:border-primary/50 transition-all cursor-pointer group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <label className="cursor-pointer block">
        <input
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            {file ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">File selected:</p>
                <p className="text-sm font-medium text-primary">{file.name}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {!file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UploadIcon className="w-4 h-4" />
              <span>Drag & drop or click to browse</span>
            </div>
          )}
        </div>
      </label>
    </Card>
  );
}
