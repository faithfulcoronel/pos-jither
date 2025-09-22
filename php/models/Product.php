<?php

declare(strict_types=1);

final class Product
{
    private string $id;
    private string $name;
    private float $price;
    private string $categoryId;
    private string $image;
    private ?string $description;

    public function __construct(
        string $id,
        string $name,
        float $price,
        string $categoryId,
        string $image,
        ?string $description = null
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->price = $price;
        $this->categoryId = $categoryId;
        $this->image = $image;
        $this->description = $description;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getCategoryId(): string
    {
        return $this->categoryId;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => $this->price,
            'categoryId' => $this->categoryId,
            'image' => $this->image,
            'description' => $this->description,
        ];
    }
}
