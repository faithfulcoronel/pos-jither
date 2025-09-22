<?php

declare(strict_types=1);

require_once __DIR__ . '/Product.php';
require_once __DIR__ . '/ProductCategory.php';

final class ProductCatalog
{
    /** @var array<string, ProductCategory> */
    private array $categories = [];

    /** @var array<string, Product> */
    private array $products = [];

    public function addCategory(ProductCategory $category): void
    {
        $this->categories[$category->getId()] = $category;
    }

    public function addProduct(Product $product): void
    {
        $categoryId = $product->getCategoryId();
        if (!isset($this->categories[$categoryId])) {
            throw new \InvalidArgumentException(sprintf(
                'Category "%s" must be added before assigning products to it.',
                $categoryId
            ));
        }

        $this->products[$product->getId()] = $product;
    }

    public function toArray(): array
    {
        $categories = array_map(
            static fn(ProductCategory $category): array => $category->toArray(),
            array_values($this->categories)
        );
        usort(
            $categories,
            static fn(array $a, array $b): int => strcasecmp($a['name'], $b['name'])
        );

        $products = array_map(
            static fn(Product $product): array => $product->toArray(),
            array_values($this->products)
        );
        usort(
            $products,
            static fn(array $a, array $b): int => strcasecmp($a['name'], $b['name'])
        );

        return [
            'productCategories' => $categories,
            'products' => $products,
            'menuItems' => array_map(
                static function (array $product): array {
                    return [
                        'id' => $product['id'],
                        'name' => $product['name'],
                        'price' => $product['price'],
                        'image' => $product['image'],
                        'categoryId' => $product['categoryId'],
                    ];
                },
                $products
            ),
        ];
    }
}
