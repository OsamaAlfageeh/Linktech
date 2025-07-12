import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FeaturedClient, InsertFeaturedClient } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface EditingClient extends Partial<FeaturedClient> {
  isNew?: boolean;
}

const FeaturedClientsManagement = () => {
  const [editingClient, setEditingClient] = useState<EditingClient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, error } = useQuery<FeaturedClient[]>({
    queryKey: ['/api/admin/featured-clients'],
    refetchOnWindowFocus: false,
  });

  const createClientMutation = useMutation({
    mutationFn: async (client: InsertFeaturedClient) => {
      const response = await apiRequest('POST', '/api/admin/featured-clients', client);
      if (!response.ok) throw new Error('Failed to create client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-clients'] });
      toast({ title: 'تم إنشاء العميل المميز بنجاح' });
      setEditingClient(null);
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({ title: 'حدث خطأ أثناء إنشاء العميل المميز', variant: 'destructive' });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, ...client }: Partial<FeaturedClient> & { id: number }) => {
      const response = await apiRequest('PUT', `/api/admin/featured-clients/${id}`, client);
      if (!response.ok) throw new Error('Failed to update client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-clients'] });
      toast({ title: 'تم تحديث العميل المميز بنجاح' });
      setEditingClient(null);
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({ title: 'حدث خطأ أثناء تحديث العميل المميز', variant: 'destructive' });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/featured-clients/${id}`);
      if (!response.ok) throw new Error('Failed to delete client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-clients'] });
      toast({ title: 'تم حذف العميل المميز بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'حدث خطأ أثناء حذف العميل المميز', variant: 'destructive' });
    },
  });

  const handleEdit = (client: FeaturedClient) => {
    setEditingClient({ ...client });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingClient({
      name: '',
      logo: '',
      website: '',
      description: '',
      category: '',
      order: clients.length + 1,
      active: true,
      isNew: true
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingClient || !editingClient.name || !editingClient.logo) {
      toast({ title: 'يرجى تعبئة جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    const clientData = {
      name: editingClient.name,
      logo: editingClient.logo,
      website: editingClient.website || '',
      description: editingClient.description || '',
      category: editingClient.category || '',
      order: editingClient.order || 0,
      active: editingClient.active ?? true
    };

    if (editingClient.isNew) {
      createClientMutation.mutate(clientData);
    } else if (editingClient.id) {
      updateClientMutation.mutate({ id: editingClient.id, ...clientData });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل المميز؟')) {
      deleteClientMutation.mutate(id);
    }
  };

  const handleToggleActive = (client: FeaturedClient) => {
    updateClientMutation.mutate({
      id: client.id,
      active: !client.active
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">حدث خطأ أثناء تحميل البيانات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء المميزين</h1>
          <p className="text-gray-600 mt-1">
            إدارة شعارات العملاء المميزين المعروضة في الصفحة الرئيسية
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={20} />
          إضافة عميل مميز
        </Button>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <p className="text-gray-600 text-sm">{client.category}</p>
                    <p className="text-gray-500 text-xs mt-1">{client.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={client.active ? "default" : "secondary"}>
                    {client.active ? "نشط" : "غير نشط"}
                  </Badge>
                  <span className="text-sm text-gray-500">الترتيب: {client.order}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(client)}
                    >
                      {client.active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for editing/creating */}
      {isModalOpen && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingClient.isNew ? 'إضافة عميل مميز' : 'تعديل عميل مميز'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">اسم العميل *</Label>
                <Input
                  id="name"
                  value={editingClient.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  placeholder="أدخل اسم العميل"
                />
              </div>

              <div>
                <Label htmlFor="logo">رابط الشعار *</Label>
                <Input
                  id="logo"
                  value={editingClient.logo || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="website">الموقع الإلكتروني</Label>
                <Input
                  id="website"
                  value={editingClient.website || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="category">الفئة</Label>
                <Input
                  id="category"
                  value={editingClient.category || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, category: e.target.value })}
                  placeholder="التقنية والاتصالات"
                />
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={editingClient.description || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, description: e.target.value })}
                  placeholder="وصف مختصر للعميل"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="order">الترتيب</Label>
                <Input
                  id="order"
                  type="number"
                  value={editingClient.order || 0}
                  onChange={(e) => setEditingClient({ ...editingClient, order: parseInt(e.target.value) })}
                  placeholder="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={editingClient.active ?? true}
                  onCheckedChange={(checked) => setEditingClient({ ...editingClient, active: checked })}
                />
                <Label htmlFor="active">نشط</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
              >
                {createClientMutation.isPending || updateClientMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedClientsManagement;