import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { getAllOrganizations, createOrganization } from "@/services/childCanisterService";
import { Principal } from "@dfinity/principal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/ui/navigation";
import { toast } from "sonner";
import { Building, Users, Star, User, Shield, Crown, Settings, Filter, Plus, ArrowRight, Copy, CheckCircle2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  reputationPoints: number;
  role: string;
  isOwner: boolean;
}

// Wallet Display Component
const WalletDisplay = () => {
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  
  if (!isConnected || !principal) return null;
  
  const principalStr = principal.toString();
  const shortPrincipal = `${principalStr.slice(0, 8)}...${principalStr.slice(-8)}`;
  
  return (
    <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-mono text-muted-foreground">{shortPrincipal}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(principalStr);
          toast.success("Principal copied to clipboard");
        }}
        className="h-6 w-6 p-0"
      >
        <Copy className="w-3 h-3" />
      </Button>
    </div>
  );
};

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case 'admin':
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'moderator':
      return <Shield className="w-4 h-4 text-blue-500" />;
    case 'member':
      return <User className="w-4 h-4 text-green-500" />;
    default:
      return <User className="w-4 h-4 text-green-500" />;
  }
};

const OrganizationCard = ({ org, onSelect, isSelected }: {
  org: Organization;
  onSelect: (org: Organization) => void;
  isSelected?: boolean;
}) => (
  <Card className={`glass-card p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[var(--shadow-glow)] group relative overflow-hidden ${
    isSelected ? 'ring-2 ring-primary shadow-[var(--shadow-glow)]' : ''
  }`}>
    {org.isOwner && (
      <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 text-xs rounded-bl-lg">
        Owner
      </div>
    )}
    
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary-glow/20 transition-all duration-300">
          <Building className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{org.name}</h3>
          <p className="text-sm text-muted-foreground">{org.category}</p>
        </div>
      </div>
      
      <Badge variant="secondary" className="flex items-center gap-1">
        <RoleIcon role={org.role} />
        {org.role}
      </Badge>
    </div>
    
    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{org.description}</p>
    
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {org.memberCount} members
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          {org.reputationPoints} rep
        </div>
      </div>
    </div>
    
    <Button 
      onClick={() => onSelect(org)}
      variant={isSelected ? "default" : "outline"}
      className="w-full group-hover:scale-105 transition-transform duration-200"
    >
      {isSelected ? 'Selected' : 'Select Organization'}
      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
    </Button>
  </Card>
);

const CreateOrgDialog = ({ onCreateOrg, creating }: {
  onCreateOrg: (name: string, description: string, category: string) => Promise<void>;
  creating: boolean;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = async () => {
    if (name.trim() && description.trim()) {
      await onCreateOrg(name, description, category);
      setName("");
      setDescription("");
      setCategory("Technology");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Organization Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your organization"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || !description.trim() || creating}
            className="w-full"
          >
            {creating ? "Creating..." : "Create Organization"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const OrgSelector = () => {
  const navigate = useNavigate();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [filter, setFilter] = useState("all");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Handle organization selection
  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
  };

  // Handle continue to dashboard
  const handleContinue = () => {
    if (selectedOrg) {
      // Set the selected organization in localStorage
      localStorage.setItem('selectedOrgId', selectedOrg.id);
      localStorage.setItem('selectedOrgName', selectedOrg.name);
      navigate('/dashboard');
    }
  };

  // Handle organization creation
  const handleCreateOrg = async (name: string, description: string, category: string) => {
    if (!principal) return;
    
    try {
      setCreating(true);
      console.log('🏗️ Creating organization:', name);
      
      // Set a flag to indicate organization creation is in progress
      localStorage.setItem('orgCreationInProgress', 'true');
      
      // Create organization on backend
      const result = await createOrganization(name, description, category);
      console.log('✅ Organization created:', result);
      
      // Add to local state
      const newOrg: Organization = {
        id: result,
        name,
        description,
        category,
        memberCount: 1,
        reputationPoints: 0,
        role: "admin",
        isOwner: true
      };
      
      setOrganizations(prev => [...prev, newOrg]);
      
      // Clear the creation flag
      localStorage.removeItem('orgCreationInProgress');
      
      console.log('✅ Organization added to local state');
      
    } catch (error) {
      console.error('❌ Error creating organization:', error);
      localStorage.removeItem('orgCreationInProgress');
    } finally {
      setCreating(false);
    }
  };

  // Load organizations from backend
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!isConnected || !principal) return;
      
      try {
        setLoading(true);
        console.log('🔄 Loading organizations...');
        
        const orgs = await getAllOrganizations();

        
        // Convert backend orgs to UI format
        const uiOrgs: Organization[] = orgs.map((org, index) => ({
          id: org.id,
          name: org.name,
          description: org.description,
          category: "Technology", // Default category for now
          memberCount: 1, // Default member count
          reputationPoints: 0, // Default reputation
          role: "admin", // Default role
          isOwner: true // Default ownership
        }));
        
        setOrganizations(uiOrgs);
        console.log('✅ Organizations loaded successfully');
        
      } catch (error) {
        console.error('Error loading organizations:', error);
        // Fallback to empty array
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [isConnected, principal]);

  const filteredOrgs = organizations.filter(org =>
    filter === "all" || 
    org.role === filter ||
    (filter === "owned" && org.isOwner)
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <Navigation />
      
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Building className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Choose Organization</h1>
                <p className="text-sm text-muted-foreground">Select your organization to continue</p>
              </div>
            </div>
            
            {/* Wallet Display in top right */}
            <WalletDisplay />
          </div>
        </div>
      </div>

      <div className="relative pt-32">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Filter and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="owned">Owned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {filteredOrgs.length} organizations
              </Badge>
            </div>

            <CreateOrgDialog onCreateOrg={handleCreateOrg} creating={creating} />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin"></div>
                Loading organizations...
              </div>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Organizations Found</h3>
              <p className="text-muted-foreground mb-6">
                {organizations.length === 0 
                  ? "You haven't joined any organizations yet. Create your first one!"
                  : "No organizations match your current filter."
                }
              </p>
              {organizations.length === 0 && (
                <CreateOrgDialog onCreateOrg={handleCreateOrg} creating={creating} />
              )}
            </div>
          ) : (
            <>
              {/* Organizations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredOrgs.map((org) => (
                  <OrganizationCard
                    key={org.id}
                    org={org}
                    onSelect={handleSelectOrg}
                    isSelected={selectedOrg?.id === org.id}
                  />
                ))}
              </div>

              {/* Continue Button */}
              {selectedOrg && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                  <Button 
                    onClick={handleContinue}
                    size="lg"
                    className="shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                  >
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgSelector;