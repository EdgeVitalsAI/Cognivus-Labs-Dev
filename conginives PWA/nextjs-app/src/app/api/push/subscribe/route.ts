import { NextRequest, NextResponse } from 'next/server';

// In-memory subscription store (use database in production)
const subscriptions: Map<string, any> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, patientId } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 400 }
      );
    }

    // Store subscription
    const key = subscription.endpoint;
    subscriptions.set(key, {
      subscription,
      patientId,
      createdAt: new Date(),
    });

    console.log(`New subscription for patient: ${patientId || 'unknown'}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (subscription?.endpoint) {
      subscriptions.delete(subscription.endpoint);
      console.log('Subscription removed');
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
