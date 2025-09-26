import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  DollarSign, 
  MessageSquare, 
  Bot, 
  TrendingUp, 
  Shield, 
  Settings,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserPlus,
  Crown,
  Heart,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Phone,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  total_users: number;
  signups_today: number;
  active_today: number;
  paid_users: number;
  total_revenue: number;
  revenue_today: number;
  avg_revenue_per_user: number;
  total_characters: number;
  characters_today: number;
  platform_characters: number;
  pending_reviews: number;
  messages_today: number;
  voice_calls_today: number;
  plan_distribution: Record<string, number>;
}

interface User {
  id: string;
  email: string;
  preferred_name: string;
  subscription_status: string;
  subscription_plan_id: string;
  plan_name: string;
  plan_price: number;
  total_spent: number;
  usage_messages_today: number;
  usage_voice_calls_today: number;
  created_at: string;
  last_active_at: string;
  status_display: string;
}

interface PlatformCharacter {
  id: string;
  name: string;
  description: string;
  personality: string[];
  category: string;
  is_featured: boolean;
  is_active: boolean;
  usage_count: number;
  rating: number;
  created_at: string;
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [characters, setCharacters] = useState<PlatformCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user?.id) return;

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
        return;
      }

      // Log admin access
      await supabase.rpc('log_admin_action', {
        admin_id: user.id,
        action_type: 'dashboard_access'
      });

      loadDashboardData();
    };

    checkAdminAccess();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load dashboard overview stats
      const { data: statsData, error: statsError } = await supabase
        .from('admin_dashboard_overview')
        .select('*')
        .single();

      if (statsError) throw statsError;
      setStats(statsData);

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('user_admin_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load platform characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('platform_characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);

    } catch (error: any) {
      toast({
        title: "Error Loading Data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          subscription_plan_id: newPlan,
          subscription_status: newPlan === 'free' ? 'free' : 'active'
        })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        admin_id: user?.id,
        action_type: 'user_plan_update',
        target_type: 'user',
        target_id: userId,
        metadata: { old_plan: 'unknown', new_plan: newPlan }
      });

      toast({
        title: "Plan Updated",
        description: "User plan has been successfully updated.",
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleCharacterStatus = async (characterId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('platform_characters')
        .update({ is_active: isActive })
        .eq('id', characterId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        admin_id: user?.id,
        action_type: 'character_status_toggle',
        target_type: 'character',
        target_id: characterId,
        metadata: { is_active: isActive }
      });

      toast({
        title: "Character Updated",
        description: `Character ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.preferred_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || user.subscription_plan_id === filterPlan;
    return matchesSearch && matchesPlan;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg font-medium text-gray-700">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LoveAI Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage users, personalities, and platform analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadDashboardData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="users">👥 Users</TabsTrigger>
            <TabsTrigger value="characters">🤖 Characters</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.signups_today || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats?.total_revenue || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +${stats?.revenue_today || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.active_today || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.messages_today || 0} messages sent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Characters</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_characters || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.platform_characters || 0} platform characters
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>User subscription breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.plan_distribution?.free || 0}
                    </div>
                    <div className="text-sm text-blue-600">Free Users</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.plan_distribution?.premium || 0}
                    </div>
                    <div className="text-sm text-purple-600">Premium Users</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.plan_distribution?.pro || 0}
                    </div>
                    <div className="text-sm text-orange-600">Pro Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and subscriptions</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">All Plans</option>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{user.preferred_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.preferred_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.subscription_plan_id === 'free' ? 'secondary' : 'default'}>
                              {user.plan_name} ${user.plan_price}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {user.usage_messages_today} msgs today
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.subscription_plan_id}
                          onChange={(e) => updateUserPlan(user.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="pro">Pro</option>
                        </select>
                        <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {user.subscription_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Characters Tab */}
          <TabsContent value="characters" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Platform Characters</CardTitle>
                    <CardDescription>Manage official platform personalities</CardDescription>
                  </div>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Character
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((character) => (
                    <Card key={character.id} className={`${character.is_active ? '' : 'opacity-60'}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{character.name}</CardTitle>
                          <div className="flex items-center space-x-1">
                            {character.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
                            <Badge variant={character.is_active ? 'default' : 'secondary'}>
                              {character.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">{character.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {character.personality.map((trait, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{character.usage_count} uses</span>
                          <span>⭐ {character.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCharacterStatus(character.id, !character.is_active)}
                          >
                            {character.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity</CardTitle>
                  <CardDescription>Messages and voice calls today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span>Messages</span>
                      </div>
                      <span className="font-semibold">{stats?.messages_today || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span>Voice Calls</span>
                      </div>
                      <span className="font-semibold">{stats?.voice_calls_today || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Metrics</CardTitle>
                  <CardDescription>Financial performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Average Revenue per User</span>
                      <span className="font-semibold">${stats?.avg_revenue_per_user?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Paid Users</span>
                      <span className="font-semibold">{stats?.paid_users || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Conversion Rate</span>
                      <span className="font-semibold">
                        {stats?.total_users ? ((stats.paid_users / stats.total_users) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 