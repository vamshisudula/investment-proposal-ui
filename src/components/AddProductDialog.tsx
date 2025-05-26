import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  getProductCategories, 
  getProductsByCategory, 
  getAssetClassForCategory 
} from '@/lib/productUtils';
import { ProductRecommendation } from '@/lib/types';
import { toast } from 'sonner';

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductRecommendation, category: string, assetClass: 'equity' | 'debt' | 'alternative') => void;
}

export const AddProductDialog = ({ isOpen, onClose, onAddProduct }: AddProductDialogProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRecommendation[]>([]);
  const [customAllocation, setCustomAllocation] = useState<number>(0);

  // Load categories when dialog opens
  useEffect(() => {
    if (isOpen) {
      const allCategories = getProductCategories();
      setCategories(allCategories);
      
      // Reset selections
      setSelectedCategory('');
      setSelectedProduct('');
      setCustomAllocation(0);
    }
  }, [isOpen]);

  // Load products when category changes
  useEffect(() => {
    if (selectedCategory) {
      const categoryProducts = getProductsByCategory(selectedCategory);
      setProducts(categoryProducts);
      setSelectedProduct('');
    } else {
      setProducts([]);
    }
  }, [selectedCategory]);

  const handleAddProduct = () => {
    if (!selectedCategory || !selectedProduct) {
      toast.error('Please select both a category and a product');
      return;
    }

    const product = products.find(p => p.name === selectedProduct);
    if (!product) {
      toast.error('Selected product not found');
      return;
    }

    const assetClass = getAssetClassForCategory(selectedCategory);
    onAddProduct(product, selectedCategory, assetClass);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Product Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={selectedProduct}
              onValueChange={setSelectedProduct}
              disabled={!selectedCategory}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.name} value={product.name}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allocation">Custom Allocation (%)</Label>
            <Input
              id="allocation"
              type="number"
              min={0}
              max={100}
              value={customAllocation}
              onChange={(e) => setCustomAllocation(Number(e.target.value))}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAddProduct}>Add Product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
