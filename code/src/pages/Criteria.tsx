import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMatching } from '@/contexts/MatchingContext';
import { MatchingCriterion } from '@/types/matching';
import { calculateMatches } from '@/lib/matching-algorithm';
import { useToast } from '@/hooks/use-toast';

export default function Criteria() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mentors, mentees, criteria, addCriterion, removeCriterion, setMatches } = useMatching();
  const [newCriterion, setNewCriterion] = useState<Partial<MatchingCriterion>>({
    menteeId: mentees[0]?.id || '',
    attribute: 'MentorId',
    condition: 'equals',
    value: ''
  });

  const attributes = [
    'MentorId', 'Gender', 'Nationality', 'City', 'Level ofStudies', 
    'GermanLevel', 'EnglishLevel', 'Birth year'
  ];

  const getAttributeOptions = (attribute: string): string[] => {
    const uniqueValues = new Set<string>();
    
    if (attribute === 'MentorId') {
      return mentors.map(m => m.id);
    }
    
    mentors.forEach(person => {
      const value = person[attribute];
      if (value !== undefined && value !== null && value !== '') {
        uniqueValues.add(String(value));
      }
    });
    
    return Array.from(uniqueValues).sort();
  };

  const [valueOptions, setValueOptions] = useState<string[]>([]);

  const handleAttributeChange = (attribute: string) => {
    setNewCriterion({ ...newCriterion, attribute, value: '' });
    setValueOptions(getAttributeOptions(attribute));
  };

  const handleAddCriterion = () => {
    if (newCriterion.value && newCriterion.menteeId) {
      addCriterion(newCriterion as MatchingCriterion);
      setNewCriterion({
        menteeId: mentees[0]?.id || '',
        attribute: 'MentorId',
        condition: 'equals',
        value: ''
      });
      setValueOptions([]);
    }
  };

  const handleGenerateMatches = () => {
    if (mentors.length === 0 || mentees.length === 0) {
      toast({
        title: 'No data available',
        description: 'Please upload CSV files first',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    const matches = calculateMatches(mentors, mentees, criteria);
    setMatches(matches);
    
    toast({
      title: 'Matches generated',
      description: `Generated ${matches.length} potential matches`
    });
    
    navigate('/matches');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Define Matching Criteria</h1>
            <p className="text-lg text-muted-foreground">
              Set exclusion rules to filter out incompatible matches
            </p>
          </header>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Add Exclusion Rule</h2>
            
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <Select
                value={newCriterion.menteeId}
                onValueChange={(value: string) => setNewCriterion({ ...newCriterion, menteeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Mentee" />
                </SelectTrigger>
                <SelectContent>
                  {mentees.map(mentee => (
                    <SelectItem key={mentee.id} value={mentee.id}>
                      {mentee.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newCriterion.attribute}
                onValueChange={handleAttributeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Attribute" />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map(attr => (
                    <SelectItem key={attr} value={attr}>
                      {attr === 'MentorId' ? 'Mentor ID' : attr.replace(/([A-Z])/g, ' $1').trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newCriterion.condition}
                onValueChange={(value: any) => setNewCriterion({ ...newCriterion, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">equals</SelectItem>
                  <SelectItem value="not_equals">not equals</SelectItem>
                  <SelectItem value="at_least">at least</SelectItem>
                  <SelectItem value="at_most">at most</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={newCriterion.value}
                onValueChange={(value: string) => setNewCriterion({ ...newCriterion, value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Value" />
                </SelectTrigger>
                <SelectContent>
                  {valueOptions.length > 0 ? (
                    valueOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-6 text-sm text-muted-foreground text-center">
                      Select attribute first
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddCriterion} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </Card>

          {criteria.length > 0 && (
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-6">Active Exclusion Rules</h2>
              <div className="space-y-3">
                {criteria.map((criterion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <p className="text-sm">
                      Mentee <span className="font-semibold text-primary">{criterion.menteeId}</span> cannot match when{' '}
                      <span className="font-semibold">{criterion.attribute === 'mentorId' ? 'Mentor ID' : criterion.attribute}</span>{' '}
                      <span className="font-semibold">{criterion.condition.replace(/_/g, ' ')}</span>{' '}
                      <span className="font-semibold text-primary">"{criterion.value}"</span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriterion(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>

            <Button
              size="lg"
              onClick={handleGenerateMatches}
              className="group"
            >
              Generate Matches
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Loaded: {mentors.length} mentors, {mentees.length} mentees</p>
          </div>
        </div>
      </div>
    </div>
  );
}
