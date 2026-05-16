<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class HealthController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        if ($request->boolean('debug') && ! app()->isProduction()) {
            return response()->json([
                'url' => $request->fullUrl(),
                'origin' => $request->headers->get('origin'),
                'host' => $request->getHost(),
                'originHeader' => $request->headers->get('origin'),
                'referer' => $request->headers->get('referer'),
                'forwardedHost' => $request->headers->get('x-forwarded-host'),
                'forwardedProto' => $request->headers->get('x-forwarded-proto'),
                'headers' => $request->headers->all(),
            ]);
        }

        return response('OK');
    }
}
