<?php

namespace App\Support\Services\Contracts;

use Illuminate\Http\UploadedFile;

interface FileUploadServiceInterface
{
  public function upload(UploadedFile $file, string $directory, string $disk = 'public'): string;
  public function uploadMultiple(array $files, string $directory, string $disk = 'public'): array;
  public function delete(string $path, string $disk = 'public'): bool;
  public function deleteMultiple(array $paths, string $disk = 'public'): bool;
  public function getUrl(string $path, string $disk = 'public'): string;
  public function exists(string $path, string $disk = 'public'): bool;
}
