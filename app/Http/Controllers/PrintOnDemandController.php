<?php

namespace App\Http\Controllers;

use Barryvdh\Snappy\Facades\SnappyImage;
use Barryvdh\Snappy\Facades\SnappyPdf;
use Illuminate\Http\Request;

class PrintOnDemandController extends Controller
{
    public function generateImage(Request $request)  {
        // return view('greeting',['name'=>"Birinder"]);
        $pdf = SnappyImage::loadView('greeting',['name'=>"Birinder"]);
        return $pdf
        ->setOption('width', '920')
        ->setOption('height', '139')
        ->inline();
    }

    public function generatePdf(Request $request)  {
        // return view('greeting',['name'=>"Birinder"]);
        $pdf = SnappyPdf::loadView('greeting',['name'=>"Birinder"]);
        return $pdf->inline();
    }
}
